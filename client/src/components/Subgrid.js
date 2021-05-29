import React from 'react';
import styled from 'styled-components';

import { useSelector, useDispatch } from 'react-redux';
import { updateSelectedCells, updateRecentlySelected, toggleDeselectMode, toggleModal } from '../utils/gridReducer';
// import { updateData } from '../utils/unitReducer';

import GridModal from './GridModal';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { modalColor } from '../utils/helpers';

dayjs.extend(customParseFormat);

const GridTimestamp = styled.div`
	background-color: lightgray;
	border: 0.5px solid black;
	writing-mode: vertical-lr;
	text-align: center;
	font-size: 1.5em;
	height: 100%;
	box-sizing: border-box;
`;

const StyledSubgrid = styled.section`
	display: grid;
	grid-column-start: 3;
	grid-column-end: -1;
	grid-row-start: 1;
	grid-row-end: -1;
	overflow: scroll;
	border: none;
	justify-content: left;
	position: relative;
	${({ checks }) => `grid-template-columns: repeat(${checks}, 35px);`}
	grid-template-rows: 100px repeat(10, 35px);
`;

const GridItem = styled.div`
	text-align: center;
	height: 100%;
	width: 100%;
	font-size: 16px;
	font-weight: bold;
	background-color: #282828;
	border: 0.5px solid black;
	box-sizing: border-box;
	cursor: pointer;
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 5px;
	color: ${props => modalColor(props)};

	&:hover {
		border: white 2px dotted;
	}

	&.selected {
		border: yellow 2px dashed;
	}

	&.selected:hover {
		border: rgb(245, 199, 26) 1px dashed;
	}
`;

function Subgrid() {
	const shiftStart = useSelector(state => state.config.shiftStart);
	const shiftEnd = useSelector(state => state.config.shiftEnd);
	const units = useSelector(state => state.units);
	const modalVisible = useSelector(state => state.modalVisible);
	const deselectMode = useSelector(state => state.grid.deselectMode);
	const selectedCells = useSelector(state => state.grid.selectedCells);
	const recentlySelected = useSelector(state => state.grid.recentlySelected);
	const dispatch = useDispatch();

	let timestamps = [];

	let i = 0;
	while (true) {
		timestamps.push(
			dayjs(shiftStart, 'HHmm')
				.add(15 * i, 'minute')
				.format('HHmm')
		);
		if (timestamps[timestamps.length - 1] === shiftEnd) break;
		i++;
	}

	function gridSelectorMouse(e) {
		e.preventDefault();
		if (e.buttons !== 1 || !e.target.classList.contains('grid-item')) return;
		if (recentlySelected.length) {
			window.clearTimeout(window.modalHide);
			dispatch(updateRecentlySelected([]));
		}

		const { unitName, timestamp } = e.target.dataset;
		const isSelected = selectedCells.find(cell => cell.unitName === unitName && cell.timestamp === timestamp);

		if (isSelected && deselectMode) {
			dispatch(updateSelectedCells(selectedCells.splice(selectedCells.indexOf([unitName, timestamp]), 1)));
		} else if (!isSelected && !deselectMode) {
			const rect = e.target.getBoundingClientRect();
			const left = window.innerWidth - rect.right < 350 ? e.target.offsetLeft - 165 : e.target.offsetLeft + 65;
			const top = e.target.offsetTop - 50;
			dispatch(updateSelectedCells([...selectedCells, { unitName, timestamp, left, top }]));
		}
	}

	function selectToggleMouse(e) {
		e.preventDefault();
		if (e.target.classList.contains('selected')) dispatch(toggleDeselectMode(true));
		gridSelectorMouse(e);
	}

	function renderInputModal() {
		if (modalVisible) return;
		dispatch(toggleDeselectMode(false));
		dispatch(toggleModal(true));
		if (!selectedCells.length && !recentlySelected.length) {
			dispatch(toggleModal(false));
			return;
		}
	}

	return (
		<StyledSubgrid
			checks={timestamps.length}
			onMouseDown={selectToggleMouse}
			onMouseOver={gridSelectorMouse}
			onMouseUp={renderInputModal}
		>
			{timestamps.map(time => (
				<GridTimestamp key={time}>{time}</GridTimestamp>
			))}
			{modalVisible && <GridModal />}
			{units.map(({ name, data }) => {
				const cells = [];
				for (let i = 0; i < timestamps.length; i++) {
					const nameCode = name.replace(' ', '');
					cells.push(
						<GridItem
							key={`${nameCode}-${timestamps[i]}`}
							className={`grid-item ${
								(selectedCells.find(cell => cell.unitName === nameCode && cell.timestamp === timestamps[i]) ||
									recentlySelected.find(cell => cell.unitName === nameCode && cell.timestamp === timestamps[i])) &&
								'selected'
							}`}
							data-unit-name={nameCode}
							data-timestamp={timestamps[i]}
							value={data?.[timestamps[i]]?.value}
						>
							{data?.[timestamps[i]]?.value}
						</GridItem>
					);
				}
				return cells;
			})}
		</StyledSubgrid>
	);
}

export default Subgrid;

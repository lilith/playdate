import type { Row } from '$lib/logics/_shared/types';
import { UNAVAILABLE } from '../_shared/constants';
import { LIGHT_BLUE, LIGHT_GRAY, WHITE } from './constants';

export const getRowColor = ({
	i,
	numRows,
	isAvailable,
	isRowExpanded
}: {
	i: number;
	numRows: number;
	isAvailable: boolean;
	isRowExpanded: boolean;
}) => {
	if (i >= numRows) return i % 2 ? LIGHT_GRAY : WHITE;
	if (isAvailable && !isRowExpanded) {
		return LIGHT_BLUE;
	}
	return i % 2 ? LIGHT_GRAY : WHITE;
};

export const isAvailableOnRow = (row: Row) =>
	!!row.availRange && !UNAVAILABLE.includes(row.availRange);

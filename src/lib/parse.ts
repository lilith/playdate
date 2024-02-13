import { PRONOUNS } from './constants';
import type { PRONOUNS_ENUM } from './types';

/*
	format availRange to look like h(:mm)a - h(:mm)a
*/
export function destructRange(availRange: string) {
	// validator and formatter
	const regexpRange =
		/\s*(?<fromhr>[0-9]+)(:(?<frommin>[0-5][0-9]))?\s*(?<fromhalf>am|pm|AM|PM)?\s*(-|to|until|till)\s*(?<tohr>[0-9]+)(:(?<tomin>[0-5][0-9]))?\s*(?<tohalf>am|pm|AM|PM)?\s*/i;
	const t = availRange.match(regexpRange)?.groups;
	if (!t) {
		return {};
	}
	let fromhalf = t.fromhalf?.toLowerCase();
	let tohalf = t.tohalf?.toLowerCase();
	const fromhr = parseInt(t.fromhr);
	const tohr = parseInt(t.tohr);
	const frommin = t.frommin ? parseInt(t.frommin) : 0;
	const tomin = t.tomin ? parseInt(t.tomin) : 0;

	if (!fromhr || fromhr > 12 || !tohr || tohr > 12 || frommin >= 60 || tomin >= 60) {
		return {};
	}

	/**
    When neither start nor stop time specifies am/pm:
        We’ll assume that kids generally do afternoons together, and that start times will be before 7pm. 
        If the start value is < 7, assume pm. If start value >= 7, assume am.
    When only start time specifies am/pm, and stop value > start value, copy start time (am/pm), otherwise use opposite (am/pm)
    When only stop time specifies am/pm, and start value < stop value, copy stop time (am/pm), otherwise use opposite
    */
	if (!fromhalf && !tohalf) {
		if (fromhr < 7) {
			fromhalf = 'pm';
		} else {
			fromhalf = 'am';
		}
		tohalf = 'pm';
	} else if (fromhalf && !tohalf) {
		if (tohr * 100 + tomin > fromhr * 100 + frommin) tohalf = fromhalf;
		else tohalf = fromhalf === 'am' ? 'pm' : 'am';
	} else if (!fromhalf && tohalf) {
		if (tohr * 100 + tomin > fromhr * 100 + frommin) fromhalf = tohalf;
		else fromhalf = tohalf === 'am' ? 'pm' : 'am';
	}
	return {
		startHr: fromhalf === 'pm' && fromhr !== 12 ? fromhr + 12 : fromhr,
		startMin: frommin,
		endHr: tohalf === 'pm' && tohr !== 12 ? tohr + 12 : tohr,
		endMin: tomin
	};
	// return `${fromhr}${frommin ? `:${frommin < 10 ? `0${frommin}` : frommin}` : ''}${fromhalf}-${tohr}${tomin ? `:${tomin < 10 ? `0${tomin}` : tomin}` : ''}${tohalf}`;
}

export function getObjectivePronoun(pronouns: PRONOUNS_ENUM) {
	let objectivePronoun = PRONOUNS[pronouns].split(', ')[2].toLowerCase();
	// turn from possessive noun to possessive adjective
	switch (pronouns) {
		case 'SHE_HER_HERS':
		case 'THEY_THEM_THEIRS':
		case 'XE_XEM_XYRS':
		case 'ZEZIE_HIR_HIRS':
			objectivePronoun = objectivePronoun.slice(0, -1);
	}
	return objectivePronoun;
}

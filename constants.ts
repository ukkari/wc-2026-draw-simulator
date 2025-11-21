import { Team } from './types';

export const TOTAL_GROUPS = 12;
export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Helper to create teams
const createTeam = (name: string, pot: number, confederation: string): Team => ({
  id: `${name}-${pot}`,
  name,
  pot,
  confederation
});

export const POT_1: Team[] = [
  createTeam('Canada (Host)', 1, 'CONCACAF'),
  createTeam('Mexico (Host)', 1, 'CONCACAF'),
  createTeam('USA (Host)', 1, 'CONCACAF'),
  createTeam('Spain', 1, 'UEFA'),
  createTeam('Argentina', 1, 'CONMEBOL'),
  createTeam('France', 1, 'UEFA'),
  createTeam('England', 1, 'UEFA'),
  createTeam('Brazil', 1, 'CONMEBOL'),
  createTeam('Portugal', 1, 'UEFA'),
  createTeam('Netherlands', 1, 'UEFA'),
  createTeam('Belgium', 1, 'UEFA'),
  createTeam('Germany', 1, 'UEFA'),
];

export const POT_2: Team[] = [
  createTeam('Croatia', 2, 'UEFA'),
  createTeam('Morocco', 2, 'CAF'),
  createTeam('Colombia', 2, 'CONMEBOL'),
  createTeam('Uruguay', 2, 'CONMEBOL'),
  createTeam('Switzerland', 2, 'UEFA'),
  createTeam('Japan', 2, 'AFC'),
  createTeam('Senegal', 2, 'CAF'),
  createTeam('Iran', 2, 'AFC'),
  createTeam('South Korea', 2, 'AFC'),
  createTeam('Ecuador', 2, 'CONMEBOL'),
  createTeam('Austria', 2, 'UEFA'),
  createTeam('Australia', 2, 'AFC'),
];

export const POT_3: Team[] = [
  createTeam('Norway', 3, 'UEFA'),
  createTeam('Panama', 3, 'CONCACAF'),
  createTeam('Egypt', 3, 'CAF'),
  createTeam('Algeria', 3, 'CAF'),
  createTeam('Scotland', 3, 'UEFA'),
  createTeam('Paraguay', 3, 'CONMEBOL'),
  createTeam('Tunisia', 3, 'CAF'),
  createTeam('Ivory Coast', 3, 'CAF'),
  createTeam('Uzbekistan', 3, 'AFC'),
  createTeam('Qatar', 3, 'AFC'),
  createTeam('Saudi Arabia', 3, 'AFC'),
  createTeam('South Africa', 3, 'CAF'),
];

export const POT_4: Team[] = [
  createTeam('Italy*', 4, 'UEFA'),
  createTeam('Turkiye*', 4, 'UEFA'),
  createTeam('Ukraine*', 4, 'UEFA'),
  createTeam('Poland*', 4, 'UEFA'),
  createTeam('DR Congo*', 4, 'CAF'),
  createTeam('Jordan', 4, 'AFC'),
  createTeam('Cape Verde', 4, 'CAF'),
  createTeam('Jamaica*', 4, 'CONCACAF'),
  createTeam('Ghana', 4, 'CAF'),
  createTeam('Curacao', 4, 'CONCACAF'),
  createTeam('Haiti', 4, 'CONCACAF'),
  createTeam('New Zealand', 4, 'OFC'),
];

export const ALL_POTS = [POT_1, POT_2, POT_3, POT_4];

export const MOCK_FLAGS: Record<string, string> = {
  // Pot 1
  'Canada (Host)': '🇨🇦', 'Mexico (Host)': '🇲🇽', 'USA (Host)': '🇺🇸',
  'Spain': '🇪🇸', 'Argentina': '🇦🇷', 'France': '🇫🇷',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Brazil': '🇧🇷', 'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Germany': '🇩🇪',
  
  // Pot 2
  'Croatia': '🇭🇷', 'Morocco': '🇲🇦', 'Colombia': '🇨🇴',
  'Uruguay': '🇺🇾', 'Switzerland': '🇨🇭', 'Japan': '🇯🇵',
  'Senegal': '🇸🇳', 'Iran': '🇮🇷', 'South Korea': '🇰🇷',
  'Ecuador': '🇪🇨', 'Austria': '🇦🇹', 'Australia': '🇦🇺',
  
  // Pot 3
  'Norway': '🇳🇴', 'Panama': '🇵🇦', 'Egypt': '🇪🇬',
  'Algeria': '🇩🇿', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Paraguay': '🇵🇾',
  'Tunisia': '🇹🇳', 'Ivory Coast': '🇨🇮', 'Uzbekistan': '🇺🇿',
  'Qatar': '🇶🇦', 'Saudi Arabia': '🇸🇦', 'South Africa': '🇿🇦',

  // Pot 4
  'Italy*': '🇮🇹', 'Turkiye*': '🇹🇷', 'Ukraine*': '🇺🇦',
  'Poland*': '🇵🇱', 'DR Congo*': '🇨🇩', 'Jordan': '🇯🇴',
  'Cape Verde': '🇨🇻', 'Jamaica*': '🇯🇲', 'Ghana': '🇬🇭',
  'Curacao': '🇨🇼', 'Haiti': '🇭🇹', 'New Zealand': '🇳🇿'
};

// Initial Empty Groups
export const INITIAL_GROUPS = GROUP_NAMES.map(name => ({
  name,
  teams: []
}));
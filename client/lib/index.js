import parseRoute from './parse-route';
import getDate, { advanceDay } from './get-date';
import AppContext from './app-context';
import clearGameStorage from './clear-game-storage';
import formatOrdinal from './format-ordinal';
import {
  hasCompletedGame,
  getGameResult,
  saveGameResult,
  isSameDay
} from './game-result';

export {
  parseRoute,
  getDate,
  advanceDay,
  AppContext,
  clearGameStorage,
  formatOrdinal,
  hasCompletedGame,
  getGameResult,
  saveGameResult,
  isSameDay
};

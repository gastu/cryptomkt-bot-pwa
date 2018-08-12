import { toDecimals } from './utils';

export default {
  toDecimals,
  localeTime: date => date.toLocaleTimeString(),
  date: (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-AR', {
      day: 'numeric',
      month: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  },
};

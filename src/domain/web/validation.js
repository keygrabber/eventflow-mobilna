export const eventStatuses = { planned: 'Planowane', active: 'Aktywne', ended: 'Zakończone' };
const number = (value) =>
  ['number', 'string'].includes(typeof value) &&
  String(value).trim() !== '' &&
  Number.isFinite(Number(value));
const integer = (value, min, max) =>
  number(value) && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
const text = (value, min, max) =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(value);
  const parts = value.split(/[-T:]/).map(Number);
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ].every((part, index) => part === parts[index]);
};

export function validateEvent(values) {
  const errors = {};
  if (!text(values.name, 2, 200)) errors.name = 'Wpisz nazwę od 2 do 200 znaków.';
  if (!text(values.venue, 2, 200)) errors.venue = 'Wpisz nazwę obiektu od 2 do 200 znaków.';
  if (!validDate(values.start_at)) errors.start_at = 'Podaj datę i godzinę rozpoczęcia.';
  if (!validDate(values.end_at) || Date.parse(values.end_at) <= Date.parse(values.start_at))
    errors.end_at = 'Zakończenie musi być późniejsze niż rozpoczęcie.';
  if (!integer(values.max_capacity, 1, 1000000))
    errors.max_capacity = 'Pojemność: liczba całkowita od 1 do 1 000 000.';
  if (!Object.hasOwn(eventStatuses, values.status)) errors.status = 'Wybierz status wydarzenia.';
  return errors;
}

export function validateZone(values, otherZones = []) {
  const errors = {};
  if (!text(values.name, 2, 100)) errors.name = 'Wpisz nazwę od 2 do 100 znaków.';
  else if (
    otherZones.some(
      (zone) => zone.name.toLocaleLowerCase('pl') === values.name.trim().toLocaleLowerCase('pl'),
    )
  )
    errors.name = 'Strefa o tej nazwie już istnieje w wydarzeniu.';
  if (!integer(values.capacity, 1, 1000000))
    errors.capacity = 'Pojemność: liczba całkowita od 1 do 1 000 000.';
  if (!integer(values.alert_threshold, 71, 100))
    errors.alert_threshold = 'Próg krytyczny: liczba całkowita od 71 do 100%.';
  const area = values.area ?? {};
  for (const key of ['x', 'y', 'width', 'height']) {
    if (!integer(area[key], ['width', 'height'].includes(key) ? 5 : 0, 100))
      errors[key] = 'Podaj całkowitą wartość w granicach planu (rozmiar min. 5).';
  }
  if (Number(area.x) + Number(area.width) > 100 || Number(area.y) + Number(area.height) > 100)
    errors.area = 'Obszar strefy musi mieścić się w planie 100 × 100.';
  if (
    !Object.keys(errors).length &&
    otherZones.some((zone) => {
      const b = zone.area;
      return (
        b &&
        Number(area.x) < b.x + b.width &&
        Number(area.x) + Number(area.width) > b.x &&
        Number(area.y) < b.y + b.height &&
        Number(area.y) + Number(area.height) > b.y
      );
    })
  )
    errors.area = 'Obszar nachodzi na inną strefę. Zmień położenie lub rozmiar.';
  return errors;
}

const STORAGE_KEY = 'jenpark_vehicles';

export const getVehicles = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

export const saveVehicle = (vehicle) => {
  const vehicles = getVehicles();
  vehicles.push(vehicle);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
};

export const updateVehicle = (id, data) => {
  const updated = getVehicles().map((v) =>
    v.id === id ? { ...v, ...data } : v
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const deleteVehicle = (id) => {
  const updated = getVehicles().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

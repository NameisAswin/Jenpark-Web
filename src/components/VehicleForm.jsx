import { useState, useEffect } from 'react';
import '../assets/vehicle-form.css';
import { saveVehicle, updateVehicle } from '../hooks/useLocalStorage';
import { vehicleRegex } from '../utils/validators';
import PlateScannerModal from './PlateScannerModal';

export default function VehicleForm({ existing, onSaved, onCancel }) {
  const now = new Date();
  const formatted = now.toISOString().slice(0, 16);

  const [ownerName,    setOwnerName]    = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleError,  setVehicleError]  = useState('');
  const [entryTime,    setEntryTime]    = useState(formatted);
  const [image,        setImage]        = useState('');
  const [error,        setError]        = useState('');
  const [showScanner,  setShowScanner]  = useState(false);

  /** Called by the scanner when it detects a plate */
  const handlePlateDetected = (plate, scannedImage = '') => {
    setVehicleNumber(plate);
    if (!vehicleRegex.test(plate)) {
      setVehicleError('Not valid · e.g. KL07AB1234');
    } else {
      setVehicleError('');
    }
    if (scannedImage) setImage(scannedImage); // use the scanner image as the plate image
    setShowScanner(false);
  };

  // Auto-uppercase + strip dashes + validate on every keystroke
  const handleVehicleChange = (e) => {
    const upper = e.target.value.toUpperCase(); // uppercase immediately
    const clean = upper.replace(/-/g, '');
    setVehicleNumber(clean);                    // store already clean value
    if (clean.length > 0 && !vehicleRegex.test(clean)) {
      setVehicleError('Not valid · e.g. KL07AB1234');
    } else {
      setVehicleError('');
    }
  };

  // Populate fields when editing
  useEffect(() => {
    if (existing) {
      setOwnerName(existing.ownerName || '');
      setVehicleNumber(existing.vehicleNumber || '');
      setEntryTime(existing.entryTime || formatted);
      setImage(existing.numberPlateImage || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Only PNG/JPG images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!ownerName.trim()) { setError('Owner name is required.'); return; }
    if (!vehicleNumber.trim()) { setError('Vehicle number is required.'); return; }
    const cleanVehicle = vehicleNumber.trim().replace(/-/g, '').toUpperCase();
    if (!vehicleRegex.test(cleanVehicle)) { setError('Not valid · e.g. KL07AB1234'); return; }

    const data = {
      ownerName:       ownerName.trim(),
      vehicleNumber:   cleanVehicle,
      entryTime,
      numberPlateImage: image,
    };

    if (existing) {
      updateVehicle(existing.id, data);
    } else {
      saveVehicle({ ...data, id: Date.now().toString() });
    }

    onSaved();
  };

  return (
    <div className="form-panel">
      <h2 className="form-panel-title">
        {existing ? '✏️ Edit Vehicle' : '🚗 Add New Vehicle'}
      </h2>

      {error && <div className="error-banner">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="owner-name">Owner Name</label>
          <input
            id="owner-name"
            className="auth-input"
            type="text"
            placeholder="e.g. John Doe"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label htmlFor="vehicle-number">Vehicle Number</label>
          <div className="input-scan-row">
            <input
              id="vehicle-number"
              className="auth-input"
              type="text"
              placeholder="KL07AB1234 or tap scan"
              value={vehicleNumber}
              onChange={handleVehicleChange}
              style={vehicleError ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
            />
            <button
              id="open-scanner-btn"
              type="button"
              className="btn btn-scan-inline"
              onClick={() => setShowScanner(true)}
              title="Auto-scan number plate via camera or image"
            >
              📷 Scan
            </button>
          </div>
          {vehicleError && (
            <span style={{ color: '#fca5a5', fontSize: 12, marginTop: 2 }}>
              ⚠ {vehicleError}
            </span>
          )}
        </div>

        <div className="field-group">
          <label htmlFor="entry-time">Entry Time</label>
          <input
            id="entry-time"
            className="auth-input"
            type="datetime-local"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label htmlFor="plate-image">Number Plate Image (PNG/JPG, max 5MB)</label>
          <input
            id="plate-image"
            className="auth-input"
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={handleImageUpload}
          />
          {image && (
            <img
              src={image}
              alt="Number plate preview"
              style={{ marginTop: 8, width: 160, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button id="vehicle-form-submit" type="submit" className="btn btn-primary">
            {existing ? 'Save Changes' : 'Add Vehicle'}
          </button>
          <button
            type="button"
            className="btn"
            style={{ background: 'var(--bg-input)', color: 'var(--text-bright)' }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Scanner Modal */}
      {showScanner && (
        <PlateScannerModal
          onDetected={handlePlateDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

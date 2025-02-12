import React, { useState } from 'react';
import useStore, { ICar } from './store/store';

const AddCarForm: React.FC = () => {
  // Access the addRow method from the store
  const addRow = useStore((state) => state.addRow);

  // Local form state
  const [newCar, setNewCar] = useState<ICar>({
    make: '',
    model: '',
    price: 0,
    electric: false,
  });

  // Handle text/number/checkbox input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewCar((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // When form is submitted
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure price is stored as a number
    addRow({ ...newCar, price: Number(newCar.price) });
    // Reset form fields
    setNewCar({
      make: '',
      model: '',
      price: 0,
      electric: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
      <div>
        <label>
          <span>Make: </span>
          <input
            name="make"
            value={newCar.make}
            onChange={handleChange}
            type="text"
            placeholder="E.g. Honda"
            required
          />
        </label>
      </div>

      <div>
        <label>
          <span>Model: </span>
          <input
            name="model"
            value={newCar.model}
            onChange={handleChange}
            type="text"
            placeholder="E.g. Civic"
            required
          />
        </label>
      </div>

      <div>
        <label>
          <span>Price: </span>
          <input
            name="price"
            value={newCar.price}
            onChange={handleChange}
            type="number"
            required
          />
        </label>
      </div>

      <div>
        <label>
          <input
            name="electric"
            checked={newCar.electric}
            onChange={handleChange}
            type="checkbox"
          />
          <span> Electric?</span>
        </label>
      </div>

      <button type="submit">Add Car</button>
    </form>
  );
};

export default AddCarForm;

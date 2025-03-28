import React, { useState } from 'react';

interface SearchFilters {
  name: string;
  technology: string;
  status: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [name, setName] = useState('');
  const [technology, setTechnology] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ name, technology, status });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="form-group">
        <label htmlFor="name">Site Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="technology">Technology</label>
        <select
          id="technology"
          value={technology}
          onChange={(e) => setTechnology(e.target.value)}
        >
          <option value="">All</option>
          <option value="5G">5G</option>
          <option value="LTE">LTE</option>
          <option value="mmWave">mmWave</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBar;

import React, { useState, useEffect } from 'react';

interface SavedSearch {
  id: number;
  name: string;
  description: string;
  criteria: {
    name: string;
    technology: string;
    status: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  };
}

interface SavedSearchesProps {
  onLoadSearch: (criteria: any) => void;
  currentCriteria: any;
}

const SavedSearches: React.FC<SavedSearchesProps> = ({ onLoadSearch, currentCriteria }) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>('');
  const [searchDescription, setSearchDescription] = useState<string>('');

  // Load saved searches from localStorage on component mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = () => {
    setIsLoading(true);
    try {
      const savedSearchesJson = localStorage.getItem('savedSearches');
      if (savedSearchesJson) {
        const parsedSearches = JSON.parse(savedSearchesJson);
        setSavedSearches(parsedSearches);
      }
    } catch (err) {
      setError('Error loading saved searches');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      setError('Search name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Create new saved search object
      const newSearch: SavedSearch = {
        id: Date.now(), // Use timestamp as ID
        name: searchName,
        description: searchDescription || '',
        criteria: currentCriteria
      };

      // Get existing saved searches
      const existingSearchesJson = localStorage.getItem('savedSearches');
      const existingSearches: SavedSearch[] = existingSearchesJson 
        ? JSON.parse(existingSearchesJson) 
        : [];

      // Add new search
      const updatedSearches = [...existingSearches, newSearch];
      
      // Save to localStorage
      localStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
      
      // Update state
      setSavedSearches(updatedSearches);

      // Reset form and close dialog
      setSearchName('');
      setSearchDescription('');
      setShowSaveDialog(false);
    } catch (err) {
      setError('Error saving search');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSearch = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this saved search?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Get existing saved searches
      const existingSearchesJson = localStorage.getItem('savedSearches');
      const existingSearches: SavedSearch[] = existingSearchesJson 
        ? JSON.parse(existingSearchesJson) 
        : [];

      // Filter out the search to delete
      const updatedSearches = existingSearches.filter(search => search.id !== id);
      
      // Save to localStorage
      localStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
      
      // Update state
      setSavedSearches(updatedSearches);
    } catch (err) {
      setError('Error deleting search');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    onLoadSearch(search.criteria);
  };

  return (
    <div className="saved-searches">
      <div className="saved-searches-header">
        <h3>Saved Searches</h3>
        <button 
          className="save-search-btn"
          onClick={() => setShowSaveDialog(true)}
        >
          Save Current Search
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showSaveDialog && (
        <div className="save-search-dialog">
          <h4>Save Current Search</h4>
          <div className="form-group">
            <label htmlFor="search-name">Name *</label>
            <input
              id="search-name"
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter a name for this search"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="search-description">Description</label>
            <textarea
              id="search-description"
              value={searchDescription}
              onChange={(e) => setSearchDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <div className="dialog-buttons">
            <button 
              onClick={() => setShowSaveDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveSearch}
              disabled={isLoading}
              className="primary-btn"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {isLoading && !showSaveDialog ? (
        <div className="loading">Loading saved searches...</div>
      ) : (
        <ul className="saved-searches-list">
          {savedSearches.length === 0 ? (
            <li className="no-saved-searches">No saved searches yet</li>
          ) : (
            savedSearches.map((search) => (
              <li key={search.id} className="saved-search-item">
                <div className="saved-search-info">
                  <h4>{search.name}</h4>
                  {search.description && <p>{search.description}</p>}
                  <div className="saved-search-criteria">
                    {search.criteria.name && <span>Name: {search.criteria.name}</span>}
                    {search.criteria.technology && <span>Tech: {search.criteria.technology}</span>}
                    {search.criteria.status && <span>Status: {search.criteria.status}</span>}
                  </div>
                </div>
                <div className="saved-search-actions">
                  <button 
                    onClick={() => handleLoadSearch(search)}
                    className="load-search-btn"
                  >
                    Load
                  </button>
                  <button 
                    onClick={() => handleDeleteSearch(search.id)}
                    className="delete-search-btn"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SavedSearches;

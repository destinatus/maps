import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar.tsx';
import SearchResults from './SearchResults.tsx';
import SavedSearches from './SavedSearches.tsx';

interface SearchCriteria {
  name: string;
  technology: string;
  status: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

interface SearchContainerProps {
  onSelectSite: (site: any) => void;
}

const SearchContainer: React.FC<SearchContainerProps> = ({ onSelectSite }) => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    name: '',
    technology: '',
    status: ''
  });
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    console.debug('Current search criteria:', searchCriteria);
  }, [searchCriteria]);

  // Perform initial search on component mount
  useEffect(() => {
    handleSearch({
      name: '',
      technology: '',
      status: ''
    });
  }, []);

  const handleSearch = async (criteria: SearchCriteria) => {
    try {
      setSearchCriteria(criteria);
      
      const response = await fetch('http://localhost:3001/api/cell-sites/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: criteria.name,
          technologies: criteria.technology ? [criteria.technology] : [],
          statuses: criteria.status ? [criteria.status] : [],
          page: 1,
          pageSize: 10,
          ...(criteria.latitude && criteria.longitude && criteria.radius && {
            minLat: criteria.latitude - 0.1,
            maxLat: criteria.latitude + 0.1,
            minLng: criteria.longitude - 0.1,
            maxLng: criteria.longitude + 0.1
          })
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      // Get response as text first
      const responseText = await response.text();
      
      // Parse the response text - handle double-stringified JSON
      let result;
      try {
        // First parse
        result = JSON.parse(responseText);
        
        // If result is still a string, parse again
        if (typeof result === 'string') {
          result = JSON.parse(result);
        }
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
        setResults([]);
        return;
      }
      
      // Process API response
      if (!result) {
        console.error('Empty API response');
        setResults([]);
        return;
      }
      
      // Extract data array safely
      const dataArray = result.data && Array.isArray(result.data) 
        ? result.data 
        : [];
      
      // Transform data to match CellSite interface
      const processedData = dataArray.map(item => ({
        id: item.id.toString(),
        name: item.name,
        technology: Array.isArray(item.technologies) && item.technologies.length > 0 
          ? item.technologies.join(', ') 
          : 'Unknown',
        status: item.status || 'Unknown',
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude)
      }));
      
      // Force a new array reference to ensure state update
      setResults([...processedData]);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  };

  return (
    <div className="search-container">
      <SearchBar onSearch={handleSearch} />
      <SavedSearches 
        onLoadSearch={handleSearch} 
        currentCriteria={searchCriteria} 
      />
      <SearchResults results={results} onSelectSite={onSelectSite} />
    </div>
  );
};

export default SearchContainer;

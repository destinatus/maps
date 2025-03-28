import React from 'react';
import '../styles/SearchResults.css';

interface CellSite {
  id: string;
  name: string;
  technology: string;
  status: string;
}

interface SearchResultsProps {
  results: CellSite[];
  onSelectSite: (site: CellSite) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelectSite }) => {
  // Helper function to normalize technology string for CSS class
  const normalizeTechClass = (tech: string): string => {
    // Handle comma-separated technologies
    if (tech.includes(',')) {
      return 'tech-' + tech.split(',')[0].trim().toLowerCase().replace(/\s+/g, '');
    }
    return 'tech-' + tech.toLowerCase().replace(/\s+/g, '');
  };

  return (
    <div className="search-results">
      <h3>Search Results ({results.length})</h3>
      {results.length > 0 ? (
        <div className="site-tiles">
          {results.map((site) => (
            <div 
              key={site.id} 
              className="site-tile" 
              onClick={() => onSelectSite(site)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${site.name}`}
            >
              <h4 title={site.name}>{site.name}</h4>
              <div className="tile-meta">
                <span className={normalizeTechClass(site.technology)}>
                  {site.technology}
                </span>
                <span className={`status-${site.status}`}>
                  {site.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">No results found</div>
      )}
    </div>
  );
};

export default SearchResults;

import React from 'react';

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
  return (
    <div className="search-results">
      <h3>Search Results ({results.length})</h3>
      {results.length > 0 ? (
        <ul>
          {results.map((site) => (
            <li key={site.id} onClick={() => onSelectSite(site)}>
              <div className="result-item">
                <h4>{site.name}</h4>
                <div className="result-meta">
                  <span className={`tech-${site.technology.toLowerCase()}`}>
                    {site.technology}
                  </span>
                  <span className={`status-${site.status}`}>
                    {site.status}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No results found</p>
      )}
    </div>
  );
};

export default SearchResults;

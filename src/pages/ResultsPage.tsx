import { useState } from 'react';
import { useBallot } from '../hooks/useBallot';

interface ResultsPageProps {
  onNavigate: (page: string) => void;
}

export function ResultsPage({ onNavigate }: ResultsPageProps) {
  const { ballotResults, groups } = useBallot();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    group?: any;
    position?: number;
  } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim() || !ballotResults) return;

    const email = searchEmail.trim().toLowerCase();
    
    // Find user's group
    const userGroup = groups.find(g => 
      g.representative.toLowerCase() === email ||
      g.members.some(m => m.toLowerCase() === email)
    );

    if (!userGroup) {
      setSearchResult({ found: false });
      return;
    }

    // Find group position
    const entry = ballotResults.entries.find(e => e.groupId === userGroup.id);
    
    setSearchResult({
      found: true,
      group: userGroup,
      position: entry?.position,
    });
  };

  if (!ballotResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Yet</h2>
          <p className="text-gray-600 mb-6">
            The ballot hasn't been drawn yet. Results will be published here once available.
          </p>
          <button onClick={() => onNavigate('landing')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const getPositionDisplay = (position: number) => {
    if (position === 1) return { emoji: '🏆', class: 'text-yellow-600', label: '1st' };
    if (position === 2) return { emoji: '🥈', class: 'text-gray-600', label: '2nd' };
    if (position === 3) return { emoji: '🥉', class: 'text-amber-600', label: '3rd' };
    return { emoji: '🎫', class: 'text-gray-600', label: `${position}th` };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ballot Results</h1>
          <p className="text-gray-600 text-lg">
            Drawn on {new Date(ballotResults.drawnAt).toLocaleDateString()} at {' '}
            {new Date(ballotResults.drawnAt).toLocaleTimeString()}
          </p>
          
          <div className="flex justify-center gap-8 mt-6 text-sm text-gray-600">
            <div>
              <span className="text-2xl font-bold text-primary-600">{ballotResults.totalGroups}</span>
              <div>Total Groups</div>
            </div>
            <div>
              <span className="text-2xl font-bold text-primary-600">{ballotResults.totalParticipants}</span>
              <div>Total Participants</div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Find Your Group</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 input-field"
                placeholder="Enter your email address"
                required
              />
              <button type="submit" className="btn-primary">
                Search
              </button>
            </div>
          </form>

          {searchResult && (
            <div className="mt-6">
              {searchResult.found && searchResult.group && searchResult.position ? (
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">
                        {getPositionDisplay(searchResult.position).emoji}
                      </span>
                      <div>
                        <h3 className="font-bold text-success-800">
                          Position #{searchResult.position}
                        </h3>
                        <p className="text-success-700">
                          {searchResult.group.name || 'Unnamed Group'} ({searchResult.group.members.length + 1} members)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-success-600">Representative:</div>
                      <div className="font-medium text-success-800">
                        {searchResult.group.representative}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-warning-600 text-2xl mr-3">❌</span>
                    <div>
                      <h3 className="font-bold text-warning-800">Not Found</h3>
                      <p className="text-warning-700">
                        This email was not part of any group in the ballot.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Allocation Order</h2>
          </div>
          
          <div className="mb-6">
            <button 
              onClick={() => {
                const csvContent = ballotResults.entries.map(entry => {
                  const group = groups.find(g => g.id === entry.groupId);
                  return `${entry.position},"${group?.name || 'Unnamed Group'}",${group?.members.length || 0},"${group?.representative || ''}"`;
                }).join('\n');
                
                const blob = new Blob([`Position,Group Name,Group Size,Representative\n${csvContent}`], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ballot-results.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="btn-secondary text-sm"
            >
              📥 Download Results
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {ballotResults.entries.map((entry) => {
              const group = groups.find(g => g.id === entry.groupId);
              const display = getPositionDisplay(entry.position);
              
              return (
                <div
                  key={entry.groupId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    entry.position <= 3 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mr-4">
                      <span className="text-2xl">{display.emoji}</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <span className={`text-2xl font-bold ${display.class} mr-2`}>
                          #{entry.position}
                        </span>
                        <span className="text-gray-900 font-medium">
                          {group?.name || `Group ${String.fromCharCode(64 + entry.position)}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {group?.members.length || 0} member{(group?.members.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right hidden md:block">
                    <div className="text-sm text-gray-500">Representative</div>
                    <div className="font-medium text-gray-900 max-w-48 truncate">
                      {group?.representative || 'Unknown'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Participant List Ordered by Position */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">🎯 Complete Allocation List</h2>
            <span className="text-sm text-gray-500">All participants in draw order</span>
          </div>
          
          <div className="mb-6">
            <button
              onClick={() => {
                // Create detailed allocation data for Excel
                const allocationData: string[] = [];
                
                ballotResults.entries
                  .sort((a, b) => a.position - b.position)
                  .forEach((entry) => {
                    const group = groups.find(g => g.id === entry.groupId);
                    if (!group) return;
                    
                    const groupName = group.name || `Group ${String.fromCharCode(64 + entry.position)}`;
                    
                    // Add representative first
                    allocationData.push(`${entry.position},"${groupName}","${group.representative}","Representative"`);
                    
                    // Add all members
                    group.members.forEach((member) => {
                      allocationData.push(`${entry.position},"${groupName}","${member}","Member"`);
                    });
                  });
                
                // Create CSV content (Excel can open CSV files)
                const csvHeader = 'Position,Group Name,Participant Email,Role\n';
                const csvContent = csvHeader + allocationData.join('\n');
                
                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `complete-allocation-list-${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
              }}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Download Excel</span>
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {ballotResults.entries
              .sort((a, b) => a.position - b.position)
              .map((entry) => {
                const group = groups.find(g => g.id === entry.groupId);
                if (!group) return null;
                
                const display = getPositionDisplay(entry.position);
                
                return (
                  <div key={entry.groupId} className={`border rounded-lg p-4 ${
                    entry.position <= 3 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm mr-3">
                        <span className="text-xl">{display.emoji}</span>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className={`text-xl font-bold ${display.class} mr-2`}>
                            #{entry.position}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {group.name || `Group ${String.fromCharCode(64 + entry.position)}`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {group.members.length + 1} participants
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-13 space-y-1">
                      {/* Representative first */}
                      <div className="flex items-center text-sm">
                        <span className="inline-block w-12 text-xs text-purple-600 font-medium">Rep:</span>
                        <span className="text-gray-900 font-medium">{group.representative}</span>
                      </div>
                      
                      {/* Members */}
                      {group.members.map((member, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <span className="inline-block w-12 text-xs text-gray-500"></span>
                          <span className="text-gray-700">{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <button onClick={() => onNavigate('landing')} className="btn-secondary">
            Back to Home
          </button>
          <button onClick={() => onNavigate('status')} className="btn-primary">
            Check My Status
          </button>
        </div>
      </div>
    </div>
  );
}
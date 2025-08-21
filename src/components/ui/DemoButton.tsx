import { ballotService } from '../../services/ballotService';
import { useBallot } from '../../hooks/useBallot';

export function DemoButton() {
  const { refresh } = useBallot();

  const loadDemoData = () => {
    try {
      // Clear existing data first
      ballotService.clearAll();
      
      // Add sample participants
      const sampleEmails = [
        'alice@example.com',
        'bob@example.com', 
        'carol@example.com',
        'david@example.com',
        'eve@example.com',
        'frank@example.com',
        'grace@example.com',
        'henry@example.com',
        'ivy@example.com',
        'jack@example.com',
        'kelly@example.com',
        'liam@example.com',
        'mia@example.com',
        'noah@example.com',
        'olivia@example.com'
      ];

      sampleEmails.forEach((email, index) => {
        try {
          ballotService.registerParticipant(email, index % 3 === 0 ? 'admin' : 'self');
        } catch (err) {
          console.warn(`Failed to add ${email}:`, err);
        }
      });

      // Create sample groups
      try {
        ballotService.createGroup('alice@example.com', ['alice@example.com', 'bob@example.com', 'carol@example.com']);
        ballotService.createGroup('david@example.com', ['david@example.com', 'eve@example.com']);
        ballotService.createGroup('frank@example.com', ['frank@example.com']);
        ballotService.createGroup('grace@example.com', ['grace@example.com', 'henry@example.com', 'ivy@example.com']);
        ballotService.createGroup('jack@example.com', ['jack@example.com', 'kelly@example.com']);
      } catch (err) {
        console.warn('Failed to create some groups:', err);
      }

      refresh();
      alert('Demo data loaded! You can now test the application.');
    } catch (err) {
      alert('Failed to load demo data: ' + (err as Error).message);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={loadDemoData}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm"
        title="Load sample data for testing"
      >
        🧪 Load Demo Data
      </button>
    </div>
  );
}
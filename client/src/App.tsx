import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeekView } from './components/Calendar/WeekView';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-synthwave-bg-dark">
        <WeekView />
      </div>
    </QueryClientProvider>
  );
}

export default App;

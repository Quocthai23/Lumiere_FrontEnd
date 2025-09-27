import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { QuickViewProvider } from './contexts/QuickViewContext';
import { RecentlyViewedProvider } from './contexts/RecentlyViewedContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Import
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider> {/* Wrap */}
        <WishlistProvider>
          <CartProvider>
            <RecentlyViewedProvider>
              <ComparisonProvider>
                <QuickViewProvider>
                  <AppRoutes />
                </QuickViewProvider>
              </ComparisonProvider>
            </RecentlyViewedProvider>
          </CartProvider>
        </WishlistProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;


import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProductGrid } from '../components/ProductGrid';

export function ProductDisplayPage(): React.ReactNode {
  const { storeId } = useParams<{ storeId: string }>();

  if (!storeId) {
    return (
      <div className="animate-fadeInUp">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">Product Display</h1>
        </div>
        <p className="text-sm text-gray-500 mt-4">No store selected. Navigate from Store View to view products.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <div className="mb-4 flex items-center gap-2">
        <BackButton />
        <h1 className="text-2xl font-bold text-gray-900">Product Display</h1>
      </div>
      <ProductGrid storeCode={storeId} />
    </div>
  );
}

function BackButton(): React.ReactNode {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className="flex items-center justify-center h-8 w-8 -ml-1 shrink-0 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}

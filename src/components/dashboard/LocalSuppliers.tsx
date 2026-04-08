import { Truck } from 'lucide-react';

const suppliers = [
  {
    item: 'Plastic cups & lids',
    where: 'Lagao wholesale',
    price: '₱3–₱5/pc',
    notes: 'Bulk discount available',
  },
  {
    item: 'Cooking oil (1 gallon)',
    where: 'Public Market',
    price: '₱350–₱400',
    notes: 'Cheaper by case',
  },
  {
    item: 'Chicken (dressed)',
    where: 'Tambler poultry',
    price: '₱180–₱200/kg',
    notes: 'Fresh daily',
  },
  {
    item: 'Fresh tuna',
    where: 'GenSan Fish Port',
    price: '₱180–₱250/kg',
    notes: 'Best prices 4–6 AM',
  },
  {
    item: 'Rice (50kg sack)',
    where: 'City warehouse',
    price: '₱2,200–₱2,600',
    notes: 'NFA & commercial',
  },
  {
    item: 'Charcoal (sack)',
    where: 'Calumpang dealers',
    price: '₱250–₱350/sack',
    notes: 'For BBQ & ihaw',
  },
];

const LocalSuppliers = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold">Local Suppliers</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Where to source materials in General Santos City
        </p>

        <div className="mt-6 bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs uppercase text-gray-500 font-medium px-6 py-3">
                    Item
                  </th>
                  <th className="text-left text-xs uppercase text-gray-500 font-medium px-6 py-3">
                    Where to Buy
                  </th>
                  <th className="text-left text-xs uppercase text-gray-500 font-medium px-6 py-3">
                    Est. Price
                  </th>
                  <th className="text-left text-xs uppercase text-gray-500 font-medium px-6 py-3">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {suppliers.map((s) => (
                  <tr key={s.item} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {s.item}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{s.where}</td>
                    <td className="px-6 py-3 text-gray-700">{s.price}</td>
                    <td className="px-6 py-3 text-gray-500">{s.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocalSuppliers;

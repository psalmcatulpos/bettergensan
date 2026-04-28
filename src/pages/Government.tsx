import { governmentCategories } from '../data/yamlLoader';
import GovernmentActivitySection from '../components/home/GovernmentActivitySection';
import SEO from '../components/SEO';
import CategoryListing from '../components/CategoryListing';

const Government: React.FC = () => {
  return (
    <CategoryListing
      categories={governmentCategories.categories}
      basePath="/government"
      sectionLabel="Government"
      overviewComponent={
        <>
          <SEO
            path="/government"
            title="Government"
            description={`Government departments and offices of the ${import.meta.env.VITE_GOVERNMENT_NAME}. Learn about local governance and public administration.`}
            keywords="government departments, local government, public administration"
          />
          <GovernmentActivitySection
            title="All local government departments"
            description={`Government departments and offices of the ${import.meta.env.VITE_GOVERNMENT_NAME}. Learn about local governance and public administration.`}
          />
        </>
      }
    />
  );
};

export default Government;

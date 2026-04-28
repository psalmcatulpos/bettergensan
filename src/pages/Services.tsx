import { serviceCategories } from '../data/yamlLoader';
import ServicesSection from '../components/home/ServicesSection';
import SEO from '../components/SEO';
import CategoryListing from '../components/CategoryListing';

const Services: React.FC = () => {
  return (
    <CategoryListing
      categories={serviceCategories.categories}
      basePath="/services"
      sectionLabel="Services"
      overviewComponent={
        <>
          <SEO
            path="/services"
            title="Services"
            description={`All services provided by the ${import.meta.env.VITE_GOVERNMENT_NAME} government. Find what you need for citizenship, business, education, and more.`}
            keywords="government services, public services, local government, civic services"
          />
          <ServicesSection
            title="All local government services"
            description={`All services provided by the ${import.meta.env.VITE_GOVERNMENT_NAME} government. Find what you need for citizenship, business, education, and more.`}
          />
        </>
      }
    />
  );
};

export default Services;

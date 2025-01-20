import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

export const BreadcrumbNav = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Don't show breadcrumbs on home page
  if (location.pathname === "/") {
    return null;
  }

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
    const isLast = index === pathSegments.length - 1;
    const formattedSegment = segment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return (
      <BreadcrumbItem key={path}>
        {!isLast ? (
          <>
            <BreadcrumbLink as={Link} to={path}>
              {formattedSegment}
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </>
        ) : (
          <BreadcrumbPage>{formattedSegment}</BreadcrumbPage>
        )}
      </BreadcrumbItem>
    );
  });

  return (
    <Breadcrumb className="mb-4 px-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/">
            Home
          </BreadcrumbLink>
          {pathSegments.length > 0 && <BreadcrumbSeparator />}
        </BreadcrumbItem>
        {breadcrumbItems}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
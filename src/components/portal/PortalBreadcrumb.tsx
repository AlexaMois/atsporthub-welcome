import { useLocation, useParams, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePortal } from "@/lib/portal-context";

export function PortalBreadcrumb() {
  const location = useLocation();
  const { docId } = useParams<{ docId: string }>();
  const { docs } = usePortal();

  const isDocPage = !!docId && location.pathname.includes("/doc/");
  const docTitle = isDocPage
    ? docs.find((d) => String(d.id) === docId)?.title || `Документ #${docId}`
    : null;

  return (
    <div className="px-6 pt-4 pb-0">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {isDocPage ? (
              <BreadcrumbLink asChild>
                <Link to="/dashboard/director">Главная</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>Главная</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {isDocPage ? (
              <BreadcrumbLink asChild>
                <Link to="/dashboard/director">Все документы</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>Все документы</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {isDocPage && docTitle && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{docTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

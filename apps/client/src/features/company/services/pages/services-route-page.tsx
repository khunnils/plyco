import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Trash2 } from "lucide-react"

import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/company/hooks/use-company"
import {
  useCreateServiceProviderUsage,
  useDeleteServiceProviderUsage,
  useUpdateServiceProviderUsage,
} from "@/features/vendors/hooks/use-vendors"
import {
  profileFromOrganization,
  dataTypeOptionsFromProfile,
} from "@/features/company/lib/profile"
import { Button } from "@/components/ui/button"
import { ServiceProfilePage } from "./service-profile-page"
import { PageHeader } from "@/features/shell/components/page-header"

export const ServicesRoutePage = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const securityProfile = useSecurityProfile()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const createServiceProviderUsage = useCreateServiceProviderUsage()
  const deleteServiceProviderUsage = useDeleteServiceProviderUsage()
  const updateServiceProviderUsage = useUpdateServiceProviderUsage()

  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)
  const organizationProviders = snapshot?.organizationProviders ?? []
  const serviceProviderUsage = snapshot?.serviceProviderUsage ?? []
  const businessActivities = snapshot?.businessActivities ?? []
  const vocabularyData = vocabulary.data

  const isCreatingService = serviceId === "new"
  const routedSelectedServiceId = serviceId && serviceId !== "new" ? serviceId : null

  // Sync URL to first service if none selected
  useEffect(() => {
    if (!serviceId && defaultValues.services[0]?.id) {
      navigate(`/company/services/${defaultValues.services[0].id}`, { replace: true })
    }
  }, [serviceId, defaultValues.services, navigate])

  const headerService =
    defaultValues.services.find(
      (service) => service.id === routedSelectedServiceId
    ) ?? defaultValues.services[0]

  const activeCompanyTitle = isCreatingService
    ? "Add service"
    : headerService?.serviceName?.trim() || "Service"

  const headerServiceIndex = Math.max(
    defaultValues.services.findIndex(
      (service) => service.id === routedSelectedServiceId
    ),
    0
  )

  const deleteSelectedService = () => {
    if (defaultValues.services.length === 1) {
      return
    }

    const nextServices = defaultValues.services.filter(
      (_, index) => index !== headerServiceIndex
    )
    const nextSelectedService =
      nextServices[Math.min(headerServiceIndex, nextServices.length - 1)] ??
      null

    saveProfile.mutate(
      {
        ...defaultValues,
        services: nextServices,
      },
      {
        onSuccess: () => {
          const nextPath = nextSelectedService?.id
            ? `/company/services/${nextSelectedService.id}`
            : "/company/services"

          navigate(nextPath)
        },
      }
    )
  }

  const isVendorMutationPending =
    createServiceProviderUsage.isPending ||
    deleteServiceProviderUsage.isPending ||
    updateServiceProviderUsage.isPending

  const dataTypeOptions = dataTypeOptionsFromProfile(
    defaultValues.dataHandling.dataTypesStored
  )

  const businessActivityOptions = businessActivities.map((activity) => ({
    value: activity.id,
    label: activity.name,
  }))

  return (
    <>
      <PageHeader eyebrow="Company" title={activeCompanyTitle}>
        {!isCreatingService ? (
          <Button
            className="w-fit"
            disabled={
              defaultValues.services.length === 1 || saveProfile.isPending
            }
            type="button"
            variant="outline"
            onClick={deleteSelectedService}
          >
            <Trash2 />
            Delete service
          </Button>
        ) : null}
      </PageHeader>

      <ServiceProfilePage
        businessActivityOptions={businessActivityOptions}
        dataTypeOptions={dataTypeOptions}
        isCreatingService={isCreatingService}
        isProfileMutationPending={saveProfile.isPending}
        isVendorMutationPending={isVendorMutationPending}
        profile={defaultValues}
        selectedServiceId={routedSelectedServiceId}
        serviceProviderUsage={serviceProviderUsage}
        organizationProviders={organizationProviders}
        vocabulary={vocabularyData}
        onCancelCreateService={() =>
          navigate(
            routedSelectedServiceId
              ? `/company/services/${routedSelectedServiceId}`
              : "/company/services"
          )
        }
        onCreateProviderUsage={(providerUsage, onSuccess) =>
          createServiceProviderUsage.mutate(providerUsage, {
            onSuccess,
          })
        }
        onDeleteProviderUsage={(providerUsage) =>
          deleteServiceProviderUsage.mutate(providerUsage.id)
        }
        onSaveProfile={(profile, onSuccess) =>
          saveProfile.mutate(profile, { onSuccess })
        }
        onSelectService={(serviceId) => {
          navigate(
            serviceId
              ? `/company/services/${serviceId}`
              : "/company/services"
          )
        }}
        onUpdateProviderUsage={(input, onSuccess) =>
          updateServiceProviderUsage.mutate(input, { onSuccess })
        }
      />
    </>
  )
}

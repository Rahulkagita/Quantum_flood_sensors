/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as OverviewRouteImport } from './routes/overview'
import { Route as ForecastRouteImport } from './routes/forecast'
import { Route as RiskMapRouteImport } from './routes/risk-map'
import { Route as QuantumOptimizerRouteImport } from './routes/quantum-optimizer'
import { Route as ResponseNetworkRouteImport } from './routes/response-network'
import { Route as ScenariosRouteImport } from './routes/scenarios'
import { Route as AlertsRouteImport } from './routes/alerts'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)

const OverviewRoute = OverviewRouteImport.update({
  id: '/overview',
  path: '/overview',
  getParentRoute: () => rootRouteImport,
} as any)

const ForecastRoute = ForecastRouteImport.update({
  id: '/forecast',
  path: '/forecast',
  getParentRoute: () => rootRouteImport,
} as any)

const RiskMapRoute = RiskMapRouteImport.update({
  id: '/risk-map',
  path: '/risk-map',
  getParentRoute: () => rootRouteImport,
} as any)

const QuantumOptimizerRoute = QuantumOptimizerRouteImport.update({
  id: '/quantum-optimizer',
  path: '/quantum-optimizer',
  getParentRoute: () => rootRouteImport,
} as any)

const ResponseNetworkRoute = ResponseNetworkRouteImport.update({
  id: '/response-network',
  path: '/response-network',
  getParentRoute: () => rootRouteImport,
} as any)

const ScenariosRoute = ScenariosRouteImport.update({
  id: '/scenarios',
  path: '/scenarios',
  getParentRoute: () => rootRouteImport,
} as any)

const AlertsRoute = AlertsRouteImport.update({
  id: '/alerts',
  path: '/alerts',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/overview': typeof OverviewRoute
  '/forecast': typeof ForecastRoute
  '/risk-map': typeof RiskMapRoute
  '/quantum-optimizer': typeof QuantumOptimizerRoute
  '/response-network': typeof ResponseNetworkRoute
  '/scenarios': typeof ScenariosRoute
  '/alerts': typeof AlertsRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/overview': typeof OverviewRoute
  '/forecast': typeof ForecastRoute
  '/risk-map': typeof RiskMapRoute
  '/quantum-optimizer': typeof QuantumOptimizerRoute
  '/response-network': typeof ResponseNetworkRoute
  '/scenarios': typeof ScenariosRoute
  '/alerts': typeof AlertsRoute
}

export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/overview': typeof OverviewRoute
  '/forecast': typeof ForecastRoute
  '/risk-map': typeof RiskMapRoute
  '/quantum-optimizer': typeof QuantumOptimizerRoute
  '/response-network': typeof ResponseNetworkRoute
  '/scenarios': typeof ScenariosRoute
  '/alerts': typeof AlertsRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/overview' | '/forecast' | '/risk-map' | '/quantum-optimizer' | '/response-network' | '/scenarios' | '/alerts'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/overview' | '/forecast' | '/risk-map' | '/quantum-optimizer' | '/response-network' | '/scenarios' | '/alerts'
  id: '__root__' | '/' | '/overview' | '/forecast' | '/risk-map' | '/quantum-optimizer' | '/response-network' | '/scenarios' | '/alerts'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  OverviewRoute: typeof OverviewRoute
  ForecastRoute: typeof ForecastRoute
  RiskMapRoute: typeof RiskMapRoute
  QuantumOptimizerRoute: typeof QuantumOptimizerRoute
  ResponseNetworkRoute: typeof ResponseNetworkRoute
  ScenariosRoute: typeof ScenariosRoute
  AlertsRoute: typeof AlertsRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/overview': {
      id: '/overview'
      path: '/overview'
      fullPath: '/overview'
      preLoaderRoute: typeof OverviewRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/forecast': {
      id: '/forecast'
      path: '/forecast'
      fullPath: '/forecast'
      preLoaderRoute: typeof ForecastRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/risk-map': {
      id: '/risk-map'
      path: '/risk-map'
      fullPath: '/risk-map'
      preLoaderRoute: typeof RiskMapRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/quantum-optimizer': {
      id: '/quantum-optimizer'
      path: '/quantum-optimizer'
      fullPath: '/quantum-optimizer'
      preLoaderRoute: typeof QuantumOptimizerRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/response-network': {
      id: '/response-network'
      path: '/response-network'
      fullPath: '/response-network'
      preLoaderRoute: typeof ResponseNetworkRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/scenarios': {
      id: '/scenarios'
      path: '/scenarios'
      fullPath: '/scenarios'
      preLoaderRoute: typeof ScenariosRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/alerts': {
      id: '/alerts'
      path: '/alerts'
      fullPath: '/alerts'
      preLoaderRoute: typeof AlertsRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  OverviewRoute: OverviewRoute,
  ForecastRoute: ForecastRoute,
  RiskMapRoute: RiskMapRoute,
  QuantumOptimizerRoute: QuantumOptimizerRoute,
  ResponseNetworkRoute: ResponseNetworkRoute,
  ScenariosRoute: ScenariosRoute,
  AlertsRoute: AlertsRoute,
}

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/**
 * Search core exports
 * Exports all search engine and filtering functionality
 */

export { SearchEngine } from './SearchEngine';
export { FilterEngine } from './FilterEngine';

export type {
  SearchResult,
  SearchMatch,
  SearchOptions,
  SearchField
} from './SearchEngine';

export type {
  FilterOptions,
  PropertyFilter,
  CustomFilter,
  FilteredGraph,
  FilterStats
} from './FilterEngine';
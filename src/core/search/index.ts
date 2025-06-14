/**
 * Search core exports
 * Exports all search engine and filtering functionality
 */

export { SearchEngine } from './SearchEngine';
export { SimpleSearchEngine } from './SimpleSearchEngine';
export { FilterEngine } from './FilterEngine';

export type {
  SearchResult,
  SearchMatch,
  SearchOptions,
  SearchField
} from './SearchEngine';

export type {
  SimpleSearchResult,
  SimpleSearchOptions
} from './SimpleSearchEngine';

export type {
  FilterOptions,
  PropertyFilter,
  CustomFilter,
  FilteredGraph,
  FilterStats
} from './FilterEngine';
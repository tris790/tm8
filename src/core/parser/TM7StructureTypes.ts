/**
 * TM7 Structure-Based Types
 * Generated from actual XML structure analysis
 */

export interface TM7ThreatModel {
  'DrawingSurfaceList'?: TM7DrawingSurfaceList;
  'MetaInformation'?: TM7MetaInformation;
  'Notes'?: TM7Notes;
  'ThreatInstances'?: TM7ThreatInstances;
  'ThreatGenerationEnabled'?: TM7ThreatGenerationEnabled;
  'Validations'?: TM7Validations;
  'Version'?: TM7Version;
  'KnowledgeBase'?: TM7KnowledgeBase;
  'Profile'?: TM7Profile;
}

export interface TM7DrawingSurfaceList {
  'DrawingSurfaceModel'?: TM7DrawingSurfaceModel;
}

export interface TM7DrawingSurfaceModel {
  'z:Id'?: string;
  'GenericTypeId'?: TM7GenericTypeId;
  'Guid'?: TM7Guid;
  'Properties'?: TM7Properties;
  'TypeId'?: TM7TypeId;
  'Borders'?: TM7Borders;
  'Header'?: TM7Header;
  'Lines'?: TM7Lines;
  'Zoom'?: TM7Zoom;
}

export interface TM7GenericTypeId {
  textContent?: string;
}

export interface TM7Guid {
  textContent?: string;
}

export interface TM7Properties {
  'a:anyType'?: TM7aanyType[];
}

export interface TM7aanyType {
  'i:type'?: string;
  'b:DisplayName'?: TM7bDisplayName;
  'b:Name'?: TM7bName;
  'b:Value'?: TM7bValue;
}

export interface TM7bDisplayName {
  textContent?: string;
}

export interface TM7bName {
}

export interface TM7bValue {
  'i:nil'?: string;
}

export interface TM7TypeId {
  textContent?: string;
}

export interface TM7Borders {
  'a:KeyValueOfguidanyType'?: TM7aKeyValueOfguidanyType[];
}

export interface TM7aKeyValueOfguidanyType {
  'a:Key'?: TM7aKey;
  'a:Value'?: TM7aValue;
}

export interface TM7aKey {
  textContent?: string;
}

export interface TM7aValue {
  'z:Id'?: string;
  'i:type'?: string;
  'GenericTypeId'?: TM7GenericTypeId;
  'Guid'?: TM7Guid;
  'Properties'?: TM7Properties;
  'TypeId'?: TM7TypeId;
  'Height'?: TM7Height;
  'Left'?: TM7Left;
  'StrokeDashArray'?: TM7StrokeDashArray;
  'StrokeThickness'?: TM7StrokeThickness;
  'Top'?: TM7Top;
  'Width'?: TM7Width;
}

export interface TM7GenericTypeId {
  textContent?: string;
}

export interface TM7Guid {
  textContent?: string;
}

export interface TM7Properties {
  'a:anyType'?: TM7aanyType[];
}

export interface TM7aanyType {
  'i:type'?: string;
  'b:DisplayName'?: TM7bDisplayName;
  'b:Name'?: TM7bName;
  'b:Value'?: TM7bValue;
}

export interface TM7bDisplayName {
  textContent?: string;
}

export interface TM7bName {
}

export interface TM7bValue {
  'i:nil'?: string;
}

export interface TM7TypeId {
  textContent?: string;
}

export interface TM7Height {
  textContent?: string;
}

export interface TM7Left {
  textContent?: string;
}

export interface TM7StrokeDashArray {
  'i:nil'?: string;
}

export interface TM7StrokeThickness {
  textContent?: string;
}

export interface TM7Top {
  textContent?: string;
}

export interface TM7Width {
  textContent?: string;
}

export interface TM7Header {
  textContent?: string;
}

export interface TM7Lines {
  'a:KeyValueOfguidanyType'?: TM7aKeyValueOfguidanyType[];
}

export interface TM7aKeyValueOfguidanyType {
  'a:Key'?: TM7aKey;
  'a:Value'?: TM7aValue;
}

export interface TM7aKey {
  textContent?: string;
}

export interface TM7aValue {
  'z:Id'?: string;
  'i:type'?: string;
  'GenericTypeId'?: TM7GenericTypeId;
  'Guid'?: TM7Guid;
  'Properties'?: TM7Properties;
  'TypeId'?: TM7TypeId;
  'HandleX'?: TM7HandleX;
  'HandleY'?: TM7HandleY;
  'PortSource'?: TM7PortSource;
  'PortTarget'?: TM7PortTarget;
  'SourceGuid'?: TM7SourceGuid;
  'SourceX'?: TM7SourceX;
  'SourceY'?: TM7SourceY;
  'TargetGuid'?: TM7TargetGuid;
  'TargetX'?: TM7TargetX;
  'TargetY'?: TM7TargetY;
}

export interface TM7GenericTypeId {
  textContent?: string;
}

export interface TM7Guid {
  textContent?: string;
}

export interface TM7Properties {
  'a:anyType'?: TM7aanyType[];
}

export interface TM7aanyType {
  'i:type'?: string;
  'b:DisplayName'?: TM7bDisplayName;
  'b:Name'?: TM7bName;
  'b:Value'?: TM7bValue;
}

export interface TM7bDisplayName {
  textContent?: string;
}

export interface TM7bName {
}

export interface TM7bValue {
  'i:nil'?: string;
}

export interface TM7TypeId {
  textContent?: string;
}

export interface TM7HandleX {
  textContent?: string;
}

export interface TM7HandleY {
  textContent?: string;
}

export interface TM7PortSource {
  textContent?: string;
}

export interface TM7PortTarget {
  textContent?: string;
}

export interface TM7SourceGuid {
  textContent?: string;
}

export interface TM7SourceX {
  textContent?: string;
}

export interface TM7SourceY {
  textContent?: string;
}

export interface TM7TargetGuid {
  textContent?: string;
}

export interface TM7TargetX {
  textContent?: string;
}

export interface TM7TargetY {
  textContent?: string;
}

export interface TM7Zoom {
  textContent?: string;
}

export interface TM7MetaInformation {
  'Assumptions'?: TM7Assumptions;
  'Contributors'?: TM7Contributors;
  'ExternalDependencies'?: TM7ExternalDependencies;
  'HighLevelSystemDescription'?: TM7HighLevelSystemDescription;
  'Owner'?: TM7Owner;
  'Reviewer'?: TM7Reviewer;
  'ThreatModelName'?: TM7ThreatModelName;
}

export interface TM7Assumptions {
}

export interface TM7Contributors {
}

export interface TM7ExternalDependencies {
}

export interface TM7HighLevelSystemDescription {
}

export interface TM7Owner {
}

export interface TM7Reviewer {
}

export interface TM7ThreatModelName {
}

export interface TM7Notes {
}

export interface TM7ThreatInstances {
  'a:KeyValueOfstringThreatpc_P0_PhOB'?: TM7aKeyValueOfstringThreatpcP0PhOB[];
}

export interface TM7aKeyValueOfstringThreatpcP0PhOB {
  'a:Key'?: TM7aKey;
  'a:Value'?: TM7aValue;
}

export interface TM7aKey {
  textContent?: string;
}

export interface TM7aValue {
  'b:ChangedBy'?: TM7bChangedBy;
  'b:DrawingSurfaceGuid'?: TM7bDrawingSurfaceGuid;
  'b:FlowGuid'?: TM7bFlowGuid;
  'b:Id'?: TM7bId;
  'b:InteractionKey'?: TM7bInteractionKey;
  'b:InteractionString'?: TM7bInteractionString;
  'b:ModifiedAt'?: TM7bModifiedAt;
  'b:Priority'?: TM7bPriority;
  'b:Properties'?: TM7bProperties;
  'b:SourceGuid'?: TM7bSourceGuid;
  'b:State'?: TM7bState;
  'b:StateInformation'?: TM7bStateInformation;
  'b:TargetGuid'?: TM7bTargetGuid;
  'b:Title'?: TM7bTitle;
  'b:TypeId'?: TM7bTypeId;
  'b:Upgraded'?: TM7bUpgraded;
  'b:UserThreatCategory'?: TM7bUserThreatCategory;
  'b:UserThreatDescription'?: TM7bUserThreatDescription;
  'b:UserThreatShortDescription'?: TM7bUserThreatShortDescription;
  'b:Wide'?: TM7bWide;
}

export interface TM7bChangedBy {
  'i:nil'?: string;
}

export interface TM7bDrawingSurfaceGuid {
  textContent?: string;
}

export interface TM7bFlowGuid {
  textContent?: string;
}

export interface TM7bId {
  textContent?: string;
}

export interface TM7bInteractionKey {
  textContent?: string;
}

export interface TM7bInteractionString {
  'i:nil'?: string;
}

export interface TM7bModifiedAt {
  textContent?: string;
}

export interface TM7bPriority {
  textContent?: string;
}

export interface TM7bProperties {
  'a:KeyValueOfstringstring'?: TM7aKeyValueOfstringstring[];
}

export interface TM7aKeyValueOfstringstring {
  'a:Key'?: TM7aKey;
  'a:Value'?: TM7aValue;
}

export interface TM7aKey {
  textContent?: string;
}

export interface TM7aValue {
  textContent?: string;
}

export interface TM7bSourceGuid {
  textContent?: string;
}

export interface TM7bState {
  textContent?: string;
}

export interface TM7bStateInformation {
  'i:nil'?: string;
}

export interface TM7bTargetGuid {
  textContent?: string;
}

export interface TM7bTitle {
  'i:nil'?: string;
}

export interface TM7bTypeId {
  textContent?: string;
}

export interface TM7bUpgraded {
  textContent?: string;
}

export interface TM7bUserThreatCategory {
  'i:nil'?: string;
}

export interface TM7bUserThreatDescription {
  'i:nil'?: string;
}

export interface TM7bUserThreatShortDescription {
  'i:nil'?: string;
}

export interface TM7bWide {
  textContent?: string;
}

export interface TM7ThreatGenerationEnabled {
  textContent?: string;
}

export interface TM7Validations {
  'a:Validation'?: TM7aValidation[];
}

export interface TM7aValidation {
  'z:Id'?: string;
  'a:ElementGuids'?: TM7aElementGuids;
  'a:Enabled'?: TM7aEnabled;
  'a:Guid'?: TM7aGuid;
  'a:IssueGuid'?: TM7aIssueGuid;
  'a:Items'?: TM7aItems;
  'a:Message'?: TM7aMessage;
  'a:Source'?: TM7aSource;
  'a:SourceGuid'?: TM7aSourceGuid;
}

export interface TM7aElementGuids {
  'b:guid'?: TM7bguid[];
}

export interface TM7bguid {
  textContent?: string;
}

export interface TM7aEnabled {
  textContent?: string;
}

export interface TM7aGuid {
  textContent?: string;
}

export interface TM7aIssueGuid {
  textContent?: string;
}

export interface TM7aItems {
}

export interface TM7aMessage {
  textContent?: string;
}

export interface TM7aSource {
}

export interface TM7aSourceGuid {
  textContent?: string;
}

export interface TM7Version {
  textContent?: string;
}

export interface TM7KnowledgeBase {
  'z:Id'?: string;
  'a:GenericElements'?: TM7aGenericElements;
  'a:Manifest'?: TM7aManifest;
  'a:StandardElements'?: TM7aStandardElements;
  'a:ThreatCategories'?: TM7aThreatCategories;
  'a:ThreatMetaData'?: TM7aThreatMetaData;
  'a:ThreatTypes'?: TM7aThreatTypes;
}

export interface TM7aGenericElements {
  'a:ElementType'?: TM7aElementType[];
}

export interface TM7aElementType {
  'a:IsExtension'?: TM7aIsExtension;
  'a:Attributes'?: TM7aAttributes;
  'a:AvailableToBaseModels'?: TM7aAvailableToBaseModels;
  'a:Behavior'?: TM7aBehavior;
  'a:Description'?: TM7aDescription;
  'a:Hidden'?: TM7aHidden;
  'a:Id'?: TM7aId;
  'a:ImageLocation'?: TM7aImageLocation;
  'a:ImageSource'?: TM7aImageSource;
  'a:ImageStream'?: TM7aImageStream;
  'a:Name'?: TM7aName;
  'a:ParentId'?: TM7aParentId;
  'a:Representation'?: TM7aRepresentation;
  'a:Shape'?: TM7aShape;
}

export interface TM7aIsExtension {
  textContent?: string;
}

export interface TM7aAttributes {
  'a:Attribute'?: TM7aAttribute[];
}

export interface TM7aAttribute {
  'a:IsExtension'?: TM7aIsExtension;
  'a:AttributeValues'?: TM7aAttributeValues;
  'a:DisplayName'?: TM7aDisplayName;
  'a:Inheritance'?: TM7aInheritance;
  'a:Mode'?: TM7aMode;
  'a:Name'?: TM7aName;
  'a:Type'?: TM7aType;
}

export interface TM7aIsExtension {
  textContent?: string;
}

export interface TM7aAttributeValues {
  'b:Value'?: TM7bValue[];
}

export interface TM7bValue {
  textContent?: string;
}

export interface TM7aDisplayName {
  textContent?: string;
}

export interface TM7aInheritance {
  textContent?: string;
}

export interface TM7aMode {
  textContent?: string;
}

export interface TM7aName {
  textContent?: string;
}

export interface TM7aType {
  textContent?: string;
}

export interface TM7aAvailableToBaseModels {
}

export interface TM7aBehavior {
  'i:nil'?: string;
}

export interface TM7aDescription {
  textContent?: string;
}

export interface TM7aHidden {
  textContent?: string;
}

export interface TM7aId {
  textContent?: string;
}

export interface TM7aImageLocation {
  textContent?: string;
}

export interface TM7aImageSource {
  textContent?: string;
}

export interface TM7aImageStream {
  'i:nil'?: string;
}

export interface TM7aName {
  textContent?: string;
}

export interface TM7aParentId {
  textContent?: string;
}

export interface TM7aRepresentation {
  textContent?: string;
}

export interface TM7aShape {
  'i:nil'?: string;
}

export interface TM7aManifest {
  'a:Author'?: TM7aAuthor;
  'a:Id'?: TM7aId;
  'a:Name'?: TM7aName;
  'a:Version'?: TM7aVersion;
}

export interface TM7aAuthor {
  textContent?: string;
}

export interface TM7aId {
  textContent?: string;
}

export interface TM7aName {
  textContent?: string;
}

export interface TM7aVersion {
  textContent?: string;
}

export interface TM7aStandardElements {
  'a:ElementType'?: TM7aElementType[];
}

export interface TM7aElementType {
  'a:IsExtension'?: TM7aIsExtension;
  'a:Attributes'?: TM7aAttributes;
  'a:AvailableToBaseModels'?: TM7aAvailableToBaseModels;
  'a:Behavior'?: TM7aBehavior;
  'a:Description'?: TM7aDescription;
  'a:Hidden'?: TM7aHidden;
  'a:Id'?: TM7aId;
  'a:ImageLocation'?: TM7aImageLocation;
  'a:ImageSource'?: TM7aImageSource;
  'a:ImageStream'?: TM7aImageStream;
  'a:Name'?: TM7aName;
  'a:ParentId'?: TM7aParentId;
  'a:Representation'?: TM7aRepresentation;
  'a:Shape'?: TM7aShape;
}

export interface TM7aIsExtension {
  textContent?: string;
}

export interface TM7aAttributes {
}

export interface TM7aAvailableToBaseModels {
}

export interface TM7aBehavior {
  'i:nil'?: string;
}

export interface TM7aDescription {
  textContent?: string;
}

export interface TM7aHidden {
  textContent?: string;
}

export interface TM7aId {
  textContent?: string;
}

export interface TM7aImageLocation {
  textContent?: string;
}

export interface TM7aImageSource {
  textContent?: string;
}

export interface TM7aImageStream {
  'i:nil'?: string;
}

export interface TM7aName {
  textContent?: string;
}

export interface TM7aParentId {
  textContent?: string;
}

export interface TM7aRepresentation {
  textContent?: string;
}

export interface TM7aShape {
  'i:nil'?: string;
}

export interface TM7aThreatCategories {
  'a:ThreatCategory'?: TM7aThreatCategory[];
}

export interface TM7aThreatCategory {
  'a:IsExtension'?: TM7aIsExtension;
  'a:Id'?: TM7aId;
  'a:LongDescription'?: TM7aLongDescription;
  'a:Name'?: TM7aName;
  'a:ShortDescription'?: TM7aShortDescription;
}

export interface TM7aIsExtension {
  textContent?: string;
}

export interface TM7aId {
  textContent?: string;
}

export interface TM7aLongDescription {
}

export interface TM7aName {
  textContent?: string;
}

export interface TM7aShortDescription {
  textContent?: string;
}

export interface TM7aThreatMetaData {
  'IsPriorityUsed'?: TM7IsPriorityUsed;
  'IsStatusUsed'?: TM7IsStatusUsed;
  'PropertiesMetaData'?: TM7PropertiesMetaData;
}

export interface TM7IsPriorityUsed {
  textContent?: string;
}

export interface TM7IsStatusUsed {
  textContent?: string;
}

export interface TM7PropertiesMetaData {
  'ThreatMetaDatum'?: TM7ThreatMetaDatum[];
}

export interface TM7ThreatMetaDatum {
  'Name'?: TM7Name;
  'Label'?: TM7Label;
  'HideFromUI'?: TM7HideFromUI;
  'Values'?: TM7Values;
  'Id'?: TM7Id;
}

export interface TM7Name {
  textContent?: string;
}

export interface TM7Label {
  textContent?: string;
}

export interface TM7HideFromUI {
  textContent?: string;
}

export interface TM7Values {
  'b:string'?: TM7bstring;
}

export interface TM7bstring {
}

export interface TM7Id {
  textContent?: string;
}

export interface TM7aThreatTypes {
  'a:ThreatType'?: TM7aThreatType[];
}

export interface TM7aThreatType {
  'a:IsExtension'?: TM7aIsExtension;
  'a:Category'?: TM7aCategory;
  'a:Description'?: TM7aDescription;
  'a:GenerationFilters'?: TM7aGenerationFilters;
  'a:Id'?: TM7aId;
  'a:PropertiesMetaData'?: TM7aPropertiesMetaData;
  'a:RelatedCategory'?: TM7aRelatedCategory;
  'a:ShortTitle'?: TM7aShortTitle;
}

export interface TM7aIsExtension {
  textContent?: string;
}

export interface TM7aCategory {
  textContent?: string;
}

export interface TM7aDescription {
  textContent?: string;
}

export interface TM7aGenerationFilters {
  'a:Exclude'?: TM7aExclude;
  'a:Include'?: TM7aInclude;
}

export interface TM7aExclude {
}

export interface TM7aInclude {
  textContent?: string;
}

export interface TM7aId {
  textContent?: string;
}

export interface TM7aPropertiesMetaData {
  'ThreatMetaDatum'?: TM7ThreatMetaDatum[];
}

export interface TM7ThreatMetaDatum {
  'Name'?: TM7Name;
  'Label'?: TM7Label;
  'HideFromUI'?: TM7HideFromUI;
  'Values'?: TM7Values;
  'Id'?: TM7Id;
}

export interface TM7Name {
  textContent?: string;
}

export interface TM7Label {
  textContent?: string;
}

export interface TM7HideFromUI {
  textContent?: string;
}

export interface TM7Values {
  'b:string'?: TM7bstring;
}

export interface TM7bstring {
  textContent?: string;
}

export interface TM7Id {
  textContent?: string;
}

export interface TM7aRelatedCategory {
  'i:nil'?: string;
}

export interface TM7aShortTitle {
  textContent?: string;
}

export interface TM7Profile {
  'PromptedKb'?: TM7PromptedKb;
}

export interface TM7PromptedKb {
}


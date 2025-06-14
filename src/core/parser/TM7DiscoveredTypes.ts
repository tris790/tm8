/**
 * Generated TM7 Schema Types (Discovered)
 * Generated: 2025-06-13T22:12:07.014Z
 */

export const TM7_NAMESPACES = {
  SCHEMAS_DATACONTRACT_ORG_2004_07_THREATMODELING_MODEL: 'http://schemas.datacontract.org/2004/07/ThreatModeling.Model',
  WWW_W3_ORG_2001_XMLSCHEMA_INSTANCE: 'http://www.w3.org/2001/XMLSchema-instance',
  SCHEMAS_MICROSOFT_COM_2003_10_SERIALIZATION_: 'http://schemas.microsoft.com/2003/10/Serialization/',
  SCHEMAS_DATACONTRACT_ORG_2004_07_THREATMODELING_MODEL_ABSTRACTS: 'http://schemas.datacontract.org/2004/07/ThreatModeling.Model.Abstracts',
  SCHEMAS_MICROSOFT_COM_2003_10_SERIALIZATION_ARRAYS: 'http://schemas.microsoft.com/2003/10/Serialization/Arrays',
  SCHEMAS_DATACONTRACT_ORG_2004_07_THREATMODELING_KNOWLEDGEBASE: 'http://schemas.datacontract.org/2004/07/ThreatModeling.KnowledgeBase',
  WWW_W3_ORG_2001_XMLSCHEMA: 'http://www.w3.org/2001/XMLSchema',
  SCHEMAS_DATACONTRACT_ORG_2004_07_THREATMODELING_INTERFACES: 'http://schemas.datacontract.org/2004/07/ThreatModeling.Interfaces',
  SCHEMAS_DATACONTRACT_ORG_2004_07_THREATMODELING_EXTERNALSTORAGE_OM: 'http://schemas.datacontract.org/2004/07/ThreatModeling.ExternalStorage.OM',
} as const;

export enum TM7DiscoveredElements {
  BORDERS = 'Borders',
  DRAWINGSURFACELIST = 'DrawingSurfaceList',
  DRAWINGSURFACEMODEL = 'DrawingSurfaceModel',
  GENERICTYPEID = 'GenericTypeId',
  GUID = 'Guid',
  HANDLEX = 'HandleX',
  HANDLEY = 'HandleY',
  HEIGHT = 'Height',
  HIDEFROMUI = 'HideFromUI',
  ID = 'Id',
  KNOWLEDGEBASE = 'KnowledgeBase',
  LABEL = 'Label',
  LEFT = 'Left',
  NAME = 'Name',
  PORTSOURCE = 'PortSource',
  PORTTARGET = 'PortTarget',
  PROPERTIES = 'Properties',
  SOURCEGUID = 'SourceGuid',
  SOURCEX = 'SourceX',
  SOURCEY = 'SourceY',
  STROKEDASHARRAY = 'StrokeDashArray',
  STROKETHICKNESS = 'StrokeThickness',
  TARGETGUID = 'TargetGuid',
  TARGETX = 'TargetX',
  TARGETY = 'TargetY',
  THREATMETADATUM = 'ThreatMetaDatum',
  THREATMODEL = 'ThreatModel',
  TOP = 'Top',
  TYPEID = 'TypeId',
  VALUES = 'Values',
  VERSION = 'Version',
  WIDTH = 'Width',
  A_ATTRIBUTE = 'a:Attribute',
  A_ATTRIBUTEVALUES = 'a:AttributeValues',
  A_ATTRIBUTES = 'a:Attributes',
  A_AUTHOR = 'a:Author',
  A_AVAILABLETOBASEMODELS = 'a:AvailableToBaseModels',
  A_BEHAVIOR = 'a:Behavior',
  A_CATEGORY = 'a:Category',
  A_DESCRIPTION = 'a:Description',
  A_DISPLAYNAME = 'a:DisplayName',
  A_ELEMENTGUIDS = 'a:ElementGuids',
  A_ELEMENTTYPE = 'a:ElementType',
  A_ENABLED = 'a:Enabled',
  A_EXCLUDE = 'a:Exclude',
  A_GENERATIONFILTERS = 'a:GenerationFilters',
  A_GENERICELEMENTS = 'a:GenericElements',
  A_GUID = 'a:Guid',
  A_HIDDEN = 'a:Hidden',
  A_ID = 'a:Id',
  A_IMAGELOCATION = 'a:ImageLocation',
  A_IMAGESOURCE = 'a:ImageSource',
  A_IMAGESTREAM = 'a:ImageStream',
  A_INCLUDE = 'a:Include',
  A_INHERITANCE = 'a:Inheritance',
  A_ISEXTENSION = 'a:IsExtension',
  A_ISSUEGUID = 'a:IssueGuid',
  A_ITEMS = 'a:Items',
  A_KEY = 'a:Key',
  A_KEYVALUEOFGUIDANYTYPE = 'a:KeyValueOfguidanyType',
  A_MANIFEST = 'a:Manifest',
  A_MESSAGE = 'a:Message',
  A_MODE = 'a:Mode',
  A_NAME = 'a:Name',
  A_PARENTID = 'a:ParentId',
  A_PROPERTIESMETADATA = 'a:PropertiesMetaData',
  A_RELATEDCATEGORY = 'a:RelatedCategory',
  A_REPRESENTATION = 'a:Representation',
  A_SHAPE = 'a:Shape',
  A_SHORTDESCRIPTION = 'a:ShortDescription',
  A_SHORTTITLE = 'a:ShortTitle',
  A_SOURCE = 'a:Source',
  A_SOURCEGUID = 'a:SourceGuid',
  A_STANDARDELEMENTS = 'a:StandardElements',
  A_THREATCATEGORIES = 'a:ThreatCategories',
  A_THREATCATEGORY = 'a:ThreatCategory',
  A_THREATTYPE = 'a:ThreatType',
  A_TYPE = 'a:Type',
  A_VALIDATION = 'a:Validation',
  A_VALUE = 'a:Value',
  A_VERSION = 'a:Version',
  A_ANYTYPE = 'a:anyType',
  A_STRING = 'a:string',
  B_DISPLAYNAME = 'b:DisplayName',
  B_NAME = 'b:Name',
  B_SELECTEDINDEX = 'b:SelectedIndex',
  B_VALUE = 'b:Value',
  B_GUID = 'b:guid',
  B_STRING = 'b:string',
}

export interface TM7Threatmodel {
  'xmlns'?: string;
  'xmlns:i'?: string;
  textContent?: string;
}

export interface TM7Drawingsurfacemodel {
  'xmlns:z'?: string;
  'z:Id'?: string;
  textContent?: string;
}

export interface TM7Generictypeid {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Guid {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Properties {
  'xmlns'?: string;
  'xmlns:a'?: string;
  textContent?: string;
}

export interface TM7AAnytype {
  'i:type'?: string;
  'xmlns:b'?: string;
  textContent?: string;
}

export interface TM7BValue {
  'i:nil'?: string;
  'i:type'?: string;
  'xmlns:c'?: string;
  textContent?: string;
}

export interface TM7Typeid {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Borders {
  'xmlns:a'?: string;
  textContent?: string;
}

export interface TM7AKeyvalueofguidanytype {
  'a:Key'?: TM7AKey | TM7AKey[];
}

export interface TM7AValue {
  'i:type'?: string;
  'z:Id'?: string;
  textContent?: string;
}

export interface TM7Height {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Left {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Strokedasharray {
  'i:nil'?: string;
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Strokethickness {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Top {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Width {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Handlex {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Handley {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Portsource {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Porttarget {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Sourceguid {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Sourcex {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Sourcey {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Targetguid {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Targetx {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7Targety {
  'xmlns'?: string;
  textContent?: string;
}

export interface TM7AValidation {
  'xmlns:z'?: string;
  'z:Id'?: string;
  textContent?: string;
}

export interface TM7AElementguids {
  'xmlns:b'?: string;
  textContent?: string;
}

export interface TM7AItems {
  'xmlns:b'?: string;
  textContent?: string;
}

export interface TM7Knowledgebase {
  'xmlns:a'?: string;
  'xmlns:z'?: string;
  'z:Id'?: string;
  textContent?: string;
}

export interface TM7AAttributes {
  'a:Attribute'?: TM7AAttribute | TM7AAttribute[];
}

export interface TM7AAttributevalues {
  'xmlns:b'?: string;
  textContent?: string;
}

export interface TM7AAvailabletobasemodels {
  'xmlns:b'?: string;
  textContent?: string;
}

export interface TM7ABehavior {
  'i:nil'?: string;
  textContent?: string;
}

export interface TM7AImagelocation {
  'i:nil'?: string;
  textContent?: string;
}

export interface TM7AImagesource {
  'i:nil'?: string;
  textContent?: string;
}

export interface TM7AImagestream {
  'i:nil'?: string;
  textContent?: string;
}

export interface TM7AShape {
  'i:nil'?: string;
  textContent?: string;
}

export interface TM7Values {
  'xmlns:b'?: string;
  textContent?: string;
}

export interface TM7BString {
  'i:nil'?: string;
  textContent?: string;
}

export interface TM7ARelatedcategory {
  'i:nil'?: string;
  textContent?: string;
}

/**
 * Schema Discovery Statistics:
 * - Elements discovered: 89
 * - Namespaces found: 9
 * - Root candidates: 
 */

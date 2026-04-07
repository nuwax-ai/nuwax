import InputOrReference from '@/components/FormListItem/InputOrReference';
import {
  BG_ICON_WORKFLOW_CODE,
  BG_ICON_WORKFLOW_CONDITION,
  BG_ICON_WORKFLOW_DATABASE,
  BG_ICON_WORKFLOW_DATABASEADD,
  BG_ICON_WORKFLOW_DATABASEDELETE,
  BG_ICON_WORKFLOW_DATABASEQUERY,
  BG_ICON_WORKFLOW_DATABASEUPDATE,
  BG_ICON_WORKFLOW_DOCUMENT_EXTRACTION,
  BG_ICON_WORKFLOW_HTTP_REQUEST,
  BG_ICON_WORKFLOW_INTENT_RECOGNITION,
  BG_ICON_WORKFLOW_KNOWLEDGE_BASE,
  BG_ICON_WORKFLOW_LLM,
  BG_ICON_WORKFLOW_LONG_TERM_MEMORY,
  BG_ICON_WORKFLOW_LOOP,
  BG_ICON_WORKFLOW_LOOPBREAK,
  BG_ICON_WORKFLOW_LOOPCONTINUE,
  BG_ICON_WORKFLOW_MCP,
  BG_ICON_WORKFLOW_OUTPUT,
  BG_ICON_WORKFLOW_PLUGIN,
  BG_ICON_WORKFLOW_QA,
  BG_ICON_WORKFLOW_TEXT_PROCESSING,
  BG_ICON_WORKFLOW_VARIABLE,
  BG_ICON_WORKFLOW_WORKFLOW,
  ICON_START,
  ICON_WORKFLOW_CODE,
  ICON_WORKFLOW_CONDITION,
  ICON_WORKFLOW_DATABASE,
  ICON_WORKFLOW_DATABASEADD,
  ICON_WORKFLOW_DATABASEDELETE,
  ICON_WORKFLOW_DATABASEQUERY,
  ICON_WORKFLOW_DATABASEUPDATE,
  ICON_WORKFLOW_DOCUMENT_EXTRACTION,
  ICON_WORKFLOW_HTTP_REQUEST,
  ICON_WORKFLOW_INTENT_RECOGNITION,
  ICON_WORKFLOW_KNOWLEDGE_BASE,
  ICON_WORKFLOW_LLM,
  ICON_WORKFLOW_LONG_TERM_MEMORY,
  ICON_WORKFLOW_LOOP,
  ICON_WORKFLOW_LOOPBREAK,
  ICON_WORKFLOW_LOOPCONTINUE,
  ICON_WORKFLOW_MCP,
  ICON_WORKFLOW_OUTPUT,
  ICON_WORKFLOW_PLUGIN,
  ICON_WORKFLOW_QA,
  ICON_WORKFLOW_TEXT_PROCESSING,
  ICON_WORKFLOW_VARIABLE,
  ICON_WORKFLOW_WORKFLOW,
} from '@/constants/images.constants';
import { t } from '@/services/i18nRuntime';
import {
  DataTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { StencilList } from '@/types/interfaces/graph';
import { SwitcherFilled } from '@ant-design/icons';
import { Cascader, Checkbox, Input } from 'antd';

// Left stencil sections.
export const asideList: StencilList[] = [
  {
    name: '',
    key: 'group1',
    children: [
      {
        name: t('PC.Pages.AntvX6Params.nodeLlmName'),
        icon: <ICON_WORKFLOW_LLM />,
        bgIcon: BG_ICON_WORKFLOW_LLM,
        type: NodeTypeEnum.LLM,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeLlmDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodePluginName'),
        icon: <ICON_WORKFLOW_PLUGIN />,
        bgIcon: BG_ICON_WORKFLOW_PLUGIN,
        type: NodeTypeEnum.Plugin,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodePluginDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeWorkflowName'),
        icon: <ICON_WORKFLOW_WORKFLOW />,
        bgIcon: BG_ICON_WORKFLOW_WORKFLOW,
        type: NodeTypeEnum.Workflow,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeWorkflowDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeMcpName'),
        icon: <ICON_WORKFLOW_MCP />,
        bgIcon: BG_ICON_WORKFLOW_MCP,
        type: NodeTypeEnum.MCP,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeMcpDescription'),
      },
    ],
  },
  {
    name: t('PC.Pages.AntvX6Params.groupBusinessLogic'),
    key: 'group2',
    children: [
      {
        name: t('PC.Pages.AntvX6Params.nodeCodeName'),
        icon: <ICON_WORKFLOW_CODE />,
        bgIcon: BG_ICON_WORKFLOW_CODE,
        type: NodeTypeEnum.Code,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeCodeDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeConditionName'),
        icon: <ICON_WORKFLOW_CONDITION />,
        bgIcon: BG_ICON_WORKFLOW_CONDITION,
        type: NodeTypeEnum.Condition,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeConditionDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeIntentRecognitionName'),
        icon: <ICON_WORKFLOW_INTENT_RECOGNITION />,
        bgIcon: BG_ICON_WORKFLOW_INTENT_RECOGNITION,
        type: NodeTypeEnum.IntentRecognition,
        shape: NodeShapeEnum.General,
        description: t(
          'PC.Pages.AntvX6Params.nodeIntentRecognitionDescription',
        ),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeLoopName'),
        icon: <ICON_WORKFLOW_LOOP />,
        bgIcon: BG_ICON_WORKFLOW_LOOP,
        type: NodeTypeEnum.Loop,
        shape: NodeShapeEnum.Loop,
        description: t('PC.Pages.AntvX6Params.nodeLoopDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeLoopContinueName'),
        icon: <ICON_WORKFLOW_LOOPCONTINUE />,
        bgIcon: BG_ICON_WORKFLOW_LOOPCONTINUE,
        type: NodeTypeEnum.LoopContinue,
        shape: NodeShapeEnum.General,
        description: '',
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeLoopBreakName'),
        icon: <ICON_WORKFLOW_LOOPBREAK />,
        bgIcon: BG_ICON_WORKFLOW_LOOPBREAK,
        type: NodeTypeEnum.LoopBreak,
        shape: NodeShapeEnum.General,
        description: '',
      },
    ],
  },
  {
    name: t('PC.Pages.AntvX6Params.groupKnowledgeData'),
    key: 'group3',
    children: [
      {
        name: t('PC.Pages.AntvX6Params.nodeKnowledgeBaseName'),
        icon: <ICON_WORKFLOW_KNOWLEDGE_BASE />,
        bgIcon: BG_ICON_WORKFLOW_KNOWLEDGE_BASE,
        type: NodeTypeEnum.Knowledge,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeKnowledgeBaseDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeVariableName'),
        icon: <ICON_WORKFLOW_VARIABLE />,
        bgIcon: BG_ICON_WORKFLOW_VARIABLE,
        type: NodeTypeEnum.Variable,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeVariableDescription'),
      },

      {
        name: t('PC.Pages.AntvX6Params.nodeLongTermMemoryName'),
        icon: <ICON_WORKFLOW_LONG_TERM_MEMORY />,
        bgIcon: BG_ICON_WORKFLOW_LONG_TERM_MEMORY,
        type: NodeTypeEnum.LongTermMemory,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeLongTermMemoryDescription'),
      },
    ],
  },
  {
    name: t('PC.Pages.AntvX6Params.groupDataTable'),
    key: 'group4',
    children: [
      {
        name: t('PC.Pages.AntvX6Params.nodeTableDataAddName'),
        icon: <ICON_WORKFLOW_DATABASEADD />,
        bgIcon: BG_ICON_WORKFLOW_DATABASEADD,
        type: NodeTypeEnum.TableDataAdd,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeTableDataAddDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeTableDataDeleteName'),
        icon: <ICON_WORKFLOW_DATABASEDELETE />,
        bgIcon: BG_ICON_WORKFLOW_DATABASEDELETE,
        type: NodeTypeEnum.TableDataDelete,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeTableDataDeleteDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeTableDataUpdateName'),
        icon: <ICON_WORKFLOW_DATABASEUPDATE />,
        bgIcon: BG_ICON_WORKFLOW_DATABASEUPDATE,
        type: NodeTypeEnum.TableDataUpdate,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeTableDataUpdateDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeTableDataQueryName'),
        icon: <ICON_WORKFLOW_DATABASEQUERY />,
        bgIcon: BG_ICON_WORKFLOW_DATABASEQUERY,
        type: NodeTypeEnum.TableDataQuery,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeTableDataQueryDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeTableSqlName'),
        icon: <ICON_WORKFLOW_DATABASE />,
        bgIcon: BG_ICON_WORKFLOW_DATABASE,
        type: NodeTypeEnum.TableSQL,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeTableSqlDescription'),
      },
    ],
  },
  {
    name: t('PC.Pages.AntvX6Params.groupComponentTool'),
    key: 'group5',
    children: [
      {
        name: t('PC.Pages.AntvX6Params.nodeQaName'),
        icon: <ICON_WORKFLOW_QA />,
        bgIcon: BG_ICON_WORKFLOW_QA,
        type: NodeTypeEnum.QA,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeQaDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeTextProcessingName'),
        icon: <ICON_WORKFLOW_TEXT_PROCESSING />,
        bgIcon: BG_ICON_WORKFLOW_TEXT_PROCESSING,
        type: NodeTypeEnum.TextProcessing,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeTextProcessingDescription'),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeDocumentExtractionName'),
        icon: <ICON_WORKFLOW_DOCUMENT_EXTRACTION />,
        bgIcon: BG_ICON_WORKFLOW_DOCUMENT_EXTRACTION,
        type: NodeTypeEnum.DocumentExtraction,
        shape: NodeShapeEnum.General,
        description: t(
          'PC.Pages.AntvX6Params.nodeDocumentExtractionDescription',
        ),
      },
      {
        name: t('PC.Pages.AntvX6Params.nodeHttpRequestName'),
        icon: <ICON_WORKFLOW_HTTP_REQUEST />,
        bgIcon: BG_ICON_WORKFLOW_HTTP_REQUEST,
        type: NodeTypeEnum.HTTPRequest,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeHttpRequestDescription'),
      },
    ],
  },
  {
    name: t('PC.Pages.AntvX6Params.groupOutput'),
    key: 'group6',
    children: [
      {
        name: t('PC.Pages.AntvX6Params.nodeProcessOutputName'),
        icon: <ICON_WORKFLOW_OUTPUT />,
        bgIcon: BG_ICON_WORKFLOW_OUTPUT,
        type: NodeTypeEnum.Output,
        shape: NodeShapeEnum.General,
        description: t('PC.Pages.AntvX6Params.nodeProcessOutputDescription'),
      },
    ],
  },
];

// Variable types for the right panel.

export const dataTypes = [
  {
    label: 'String',
    value: DataTypeEnum.String,
  },
  {
    label: 'Integer',
    value: DataTypeEnum.Integer,
  },
  {
    label: 'Number',
    value: DataTypeEnum.Number,
  },
  {
    label: 'File',
    value: 'File',
    children: [
      {
        label: 'Default',
        value: DataTypeEnum.File_Default,
      },
      {
        label: 'Doc',
        value: DataTypeEnum.File_Doc,
      },
      {
        label: 'Excel',
        value: DataTypeEnum.File_Excel,
      },
      {
        label: 'PPT',
        value: DataTypeEnum.File_PPT,
      },
      {
        label: 'Txt',
        value: DataTypeEnum.File_Txt,
      },
      {
        label: 'Image',
        value: DataTypeEnum.File_Image,
      },
      {
        label: 'Audio',
        value: DataTypeEnum.File_Audio,
      },
      {
        label: 'Video',
        value: DataTypeEnum.File_Video,
      },
      {
        label: 'Svg',
        value: DataTypeEnum.File_Svg,
      },
      {
        label: 'Code',
        value: DataTypeEnum.File_Code,
      },
    ],
  },
  {
    label: 'Boolean',
    value: DataTypeEnum.Boolean,
  },
  {
    label: 'Object',
    value: DataTypeEnum.Object,
  },
  {
    label: 'Array<String>',
    value: DataTypeEnum.Array_String,
  },
  {
    label: 'Array<Integer>',
    value: DataTypeEnum.Array_Integer,
  },
  {
    label: 'Array<Number>',
    value: DataTypeEnum.Array_Number,
  },
  {
    label: 'Array<Boolean>',
    value: DataTypeEnum.Array_Boolean,
  },
  {
    label: 'Array<Object>',
    value: DataTypeEnum.Array_Object,
  },
  {
    label: 'Array<File>',
    value: 'Array_File',
    children: [
      {
        label: 'Default',
        value: DataTypeEnum.Array_File_Default,
      },
      {
        label: 'Array<Image>',
        value: DataTypeEnum.Array_File_Image,
      },
      {
        label: 'Array<Doc>',
        value: DataTypeEnum.Array_File_Doc,
      },
      {
        label: 'Array<Code>',
        value: DataTypeEnum.Array_File_Code, // "Array<Code>" maps to "Array_File_Default".
      },
      {
        label: 'Array<PPT>',
        value: DataTypeEnum.Array_File_PPT,
      },
      {
        label: 'Array<Txt>',
        value: DataTypeEnum.Array_File_Txt,
      },
      {
        label: 'Array<Excel>',
        value: DataTypeEnum.Array_File_Excel,
      },
      {
        label: 'Array<Audio>',
        value: DataTypeEnum.Array_File_Audio,
      },
      {
        label: 'Array<Zip>',
        value: DataTypeEnum.Array_File_Zip,
      },
      {
        label: 'Array<Video>',
        value: DataTypeEnum.Array_File_Video,
      },
      {
        label: 'Array<Svg>',
        value: DataTypeEnum.Array_File_Svg, // "Array<Svg>" maps to "Array_File_Default".
      },
    ],
  },
];

// Mock model input schema.
export const modelTypes = [
  {
    label: t('PC.Pages.AntvX6Params.modelTypeTitleGeneration'),
    icon: <ICON_START />,
    key: 'titleGeneration',
    children: [
      {
        key: 'output',
        label: 'output',
        tag: 'String',
      },
      {
        key: 'setting',
        label: 'Setting',
        tag: 'Number',
      },
    ],
  },
];

// Loop mode options.
export const cycleOption = [
  {
    label: t('PC.Pages.AntvX6Params.cycleArrayLoop'),
    value: 'ARRAY_LOOP',
  },
  {
    label: t('PC.Pages.AntvX6Params.cycleSpecifyTimesLoop'),
    value: 'SPECIFY_TIMES_LOOP',
  },
  {
    label: t('PC.Pages.AntvX6Params.cycleInfiniteLoop'),
    value: 'INFINITE_LOOP',
  },
];
export const InputConfigs = [
  {
    name: 'name',
    placeholder: t('PC.Pages.AntvX6Params.inputVariableName'),
    label: t('PC.Pages.AntvX6Params.inputVariableName'),
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.inputVariableNameRequired'),
      },
    ],
    component: Input,
    width: 140,
  },
  {
    name: 'dataType',
    placeholder: t('PC.Pages.AntvX6Params.selectType'),
    label: t('PC.Pages.AntvX6Params.inputVariableType'),
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.inputVariableTypeRequired'),
      },
    ],
    component: Cascader,
    width: 110,
    options: dataTypes,
  },
  {
    name: 'description',
    placeholder: t('PC.Pages.AntvX6Params.description'),
    label: '',
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.descriptionRequired'),
      },
    ],
    component: Checkbox,
    width: 0,
  },
  {
    name: 'require',
    placeholder: t('PC.Pages.AntvX6Params.inputVariableName'),
    label: '',
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.inputVariableNameRequired'),
      },
    ],
    component: Checkbox,
    width: 0,
  },
];

export const outPutConfigs = [
  {
    name: 'name',
    placeholder: t('PC.Pages.AntvX6Params.paramName'),
    label: t('PC.Pages.AntvX6Params.paramName'),
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.paramNameRequired'),
      },
    ],
    component: Input,
    width: 100,
  },
  {
    name: 'bindValue',
    placeholder: t('PC.Pages.AntvX6Params.inputOrReferenceParamValue'),
    label: t('PC.Pages.AntvX6Params.paramValue'),
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.paramValueRequired'),
      },
    ],
    component: InputOrReference,
    width: 180,
  },
  {
    name: 'description',
    placeholder: t('PC.Pages.AntvX6Params.description'),
    label: '',
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.descriptionRequired'),
      },
    ],
    component: Checkbox,
    width: 0,
  },
];

// Intent recognition parameter configs.
export const intentionConfigs = [
  {
    name: 'intent',
    placeholder: t('PC.Pages.AntvX6Params.inputParamValue'),
    label: '',
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.intentDescriptionRequired'),
      },
    ],
    component: Input,
    width: 296,
  },
];

export const modelConfigs = [
  {
    name: 'name',
    placeholder: t('PC.Pages.AntvX6Params.paramName'),
    label: t('PC.Pages.AntvX6Params.paramName'),
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.paramNameRequired'),
      },
    ],
    component: Input,
    width: 140,
  },
  {
    name: 'paramsValue',
    placeholder: t('PC.Pages.AntvX6Params.inputOrReferenceVariableValue'),
    label: t('PC.Pages.AntvX6Params.variableValue'),
    rules: [
      {
        required: true,
        message: t('PC.Pages.AntvX6Params.variableValueRequired'),
      },
    ],
    component: InputOrReference,
    width: 120,
  },
];

// Workflow drawer left menu.
export const leftMenuList = [
  {
    icon: <SwitcherFilled />,
    name: t('PC.Pages.AntvX6Params.resourceWorkflow'),
    key: 'resources',
  },
  {
    icon: <SwitcherFilled />,
    name: t('PC.Pages.AntvX6Params.officialExample'),
    key: 'example',
  },
];

// Operators for condition branches and data filters.
export const options = [
  {
    label: t('PC.Pages.AntvX6Params.operatorEqual'),
    value: 'EQUAL',
    displayValue: '=',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorNotEqual'),
    value: 'NOT_EQUAL',
    displayValue: '≠',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorGreaterThan'),
    value: 'GREATER_THAN',
    displayValue: '>',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorGreaterThanOrEqual'),
    value: 'GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorLessThan'),
    value: 'LESS_THAN',
    displayValue: '<',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorLessThanOrEqual'),
    value: 'LESS_THAN_OR_EQUAL',
    displayValue: '≤',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorLengthGreaterThan'),
    value: 'LENGTH_GREATER_THAN',
    displayValue: '>',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorLengthGreaterThanOrEqual'),
    value: 'LENGTH_GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorLengthLessThan'),
    value: 'LENGTH_LESS_THAN',
    displayValue: '<',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorLengthLessThanOrEqual'),
    value: 'LENGTH_LESS_THAN_OR_EQUAL',
    displayValue: '≤',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorContains'),
    value: 'CONTAINS',
    displayValue: '⊃',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorNotContains'),
    value: 'NOT_CONTAINS',
    displayValue: '⊅',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorMatchRegex'),
    value: 'MATCH_REGEX',
    displayValue: '~',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorIsNull'),
    value: 'IS_NULL',
    displayValue: '∅',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorNotNull'),
    value: 'NOT_NULL',
    displayValue: '!∅',
  },
];

export const tableOptions = [
  {
    label: t('PC.Pages.AntvX6Params.operatorEqual'),
    value: 'EQUAL',
    displayValue: '=',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorNotEqual'),
    value: 'NOT_EQUAL',
    displayValue: '≠',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorGreaterThan'),
    value: 'GREATER_THAN',
    displayValue: '>',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorGreaterThanOrEqual'),
    value: 'GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorLessThan'),
    value: 'LESS_THAN',
    displayValue: '<',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorLessThanOrEqual'),
    value: 'LESS_THAN_OR_EQUAL',
    displayValue: '≤',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorIn'),
    value: 'IN',
    displayValue: '⊃',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorNotIn'),
    value: 'NOT_IN',
    displayValue: '⊅',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorIsNull'),
    value: 'IS_NULL',
    displayValue: '∅',
  },
  {
    label: t('PC.Pages.AntvX6Params.operatorNotNull'),
    value: 'NOT_NULL',
    displayValue: '!∅',
  },
];

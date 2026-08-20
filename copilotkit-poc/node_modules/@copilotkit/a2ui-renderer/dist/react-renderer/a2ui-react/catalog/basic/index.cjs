const require_runtime = require('../../../../_virtual/_rolldown/runtime.cjs');
const require_Text = require('./components/Text.cjs');
const require_Image = require('./components/Image.cjs');
const require_Icon = require('./components/Icon.cjs');
const require_Video = require('./components/Video.cjs');
const require_AudioPlayer = require('./components/AudioPlayer.cjs');
const require_Row = require('./components/Row.cjs');
const require_Column = require('./components/Column.cjs');
const require_List = require('./components/List.cjs');
const require_Card = require('./components/Card.cjs');
const require_Tabs = require('./components/Tabs.cjs');
const require_Divider = require('./components/Divider.cjs');
const require_Modal = require('./components/Modal.cjs');
const require_Button = require('./components/Button.cjs');
const require_TextField = require('./components/TextField.cjs');
const require_CheckBox = require('./components/CheckBox.cjs');
const require_ChoicePicker = require('./components/ChoicePicker.cjs');
const require_Slider = require('./components/Slider.cjs');
const require_DateTimeInput = require('./components/DateTimeInput.cjs');
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

//#region src/react-renderer/a2ui-react/catalog/basic/index.ts
/**
* Copyright 2026 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
const basicComponents = [
	require_Text.Text,
	require_Image.Image,
	require_Icon.Icon,
	require_Video.Video,
	require_AudioPlayer.AudioPlayer,
	require_Row.Row,
	require_Column.Column,
	require_List.List,
	require_Card.Card,
	require_Tabs.Tabs,
	require_Divider.Divider,
	require_Modal.Modal,
	require_Button.Button,
	require_TextField.TextField,
	require_CheckBox.CheckBox,
	require_ChoicePicker.ChoicePicker,
	require_Slider.Slider,
	require_DateTimeInput.DateTimeInput
];
const basicCatalog = new _a2ui_web_core_v0_9.Catalog("https://a2ui.org/specification/v0_9/basic_catalog.json", basicComponents, _a2ui_web_core_v0_9_basic_catalog.BASIC_FUNCTIONS);

//#endregion
exports.basicCatalog = basicCatalog;
//# sourceMappingURL=index.cjs.map
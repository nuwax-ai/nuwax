import { Text } from "./components/Text.mjs";
import { Image } from "./components/Image.mjs";
import { Icon } from "./components/Icon.mjs";
import { Video } from "./components/Video.mjs";
import { AudioPlayer } from "./components/AudioPlayer.mjs";
import { Row } from "./components/Row.mjs";
import { Column } from "./components/Column.mjs";
import { List } from "./components/List.mjs";
import { Card } from "./components/Card.mjs";
import { Tabs } from "./components/Tabs.mjs";
import { Divider } from "./components/Divider.mjs";
import { Modal } from "./components/Modal.mjs";
import { Button } from "./components/Button.mjs";
import { TextField } from "./components/TextField.mjs";
import { CheckBox } from "./components/CheckBox.mjs";
import { ChoicePicker } from "./components/ChoicePicker.mjs";
import { Slider } from "./components/Slider.mjs";
import { DateTimeInput } from "./components/DateTimeInput.mjs";
import { Catalog } from "@a2ui/web_core/v0_9";
import { BASIC_FUNCTIONS } from "@a2ui/web_core/v0_9/basic_catalog";

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
	Text,
	Image,
	Icon,
	Video,
	AudioPlayer,
	Row,
	Column,
	List,
	Card,
	Tabs,
	Divider,
	Modal,
	Button,
	TextField,
	CheckBox,
	ChoicePicker,
	Slider,
	DateTimeInput
];
const basicCatalog = new Catalog("https://a2ui.org/specification/v0_9/basic_catalog.json", basicComponents, BASIC_FUNCTIONS);

//#endregion
export { basicCatalog };
//# sourceMappingURL=index.mjs.map
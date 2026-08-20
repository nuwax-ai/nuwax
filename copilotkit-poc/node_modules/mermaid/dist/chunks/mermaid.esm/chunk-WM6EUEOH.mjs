import {
  AbstractMermaidTokenBuilder,
  CommonValueConverter,
  EmptyFileSystem,
  MermaidGeneratedSharedModule,
  RadarGrammarGeneratedModule,
  __name as __name2,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject
} from "./chunk-NW2N4LI3.mjs";
import {
  __name
} from "./chunk-PTVI3W5X.mjs";

// ../parser/dist/chunks/mermaid-parser.core/chunk-FHYWG6QK.mjs
var RadarTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "RadarTokenBuilder");
  }
  static {
    __name2(this, "RadarTokenBuilder");
  }
  constructor() {
    super(["radar-beta"]);
  }
};
var RadarModule = {
  parser: {
    TokenBuilder: /* @__PURE__ */ __name2(() => new RadarTokenBuilder(), "TokenBuilder"),
    ValueConverter: /* @__PURE__ */ __name2(() => new CommonValueConverter(), "ValueConverter")
  }
};
function createRadarServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Radar = inject(
    createDefaultCoreModule({ shared }),
    RadarGrammarGeneratedModule,
    RadarModule
  );
  shared.ServiceRegistry.register(Radar);
  return { shared, Radar };
}
__name(createRadarServices, "createRadarServices");
__name2(createRadarServices, "createRadarServices");

export {
  RadarModule,
  createRadarServices
};

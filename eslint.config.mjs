import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

const BANNED_PATHS = [
  { name: "moment", message: "Use date-fns or Intl — moment is dead and 300KB" },
  { name: "axios", message: "Use native fetch" },
  { name: "request", message: "Dead package — use native fetch" },
  { name: "request-promise", message: "Dead package — use native fetch" },
  { name: "node-fetch", message: "Built into Node 18+ — use native fetch" },
  { name: "isomorphic-fetch", message: "Built into Node 18+ — use native fetch" },
  { name: "got", message: "Use native fetch" },
  { name: "embla-carousel", message: "Use Swiper for carousels — Embla is banned" },
  { name: "embla-carousel-react", message: "Use Swiper for carousels — Embla is banned" },
  { name: "embla-carousel-autoplay", message: "Use Swiper for carousels — Embla is banned" },
  { name: "lodash", message: "Use native Array/Object methods" },
  { name: "underscore", message: "Use native Array/Object methods" },
  { name: "uuid", message: "Use crypto.randomUUID() — built into Node 19+" },
  { name: "nanoid", message: "Use crypto.randomUUID() — built into Node 19+" },
  { name: "pg", message: "Use Drizzle ORM from @/db — do not use raw pg client" },
  { name: "postgres", message: "Use Drizzle ORM from @/db — do not use raw postgres client" },
];

const BANNED_PATTERNS = [
  { group: ["lodash/*"], message: "Use native Array/Object methods" },
  { group: ["lodash-es/*"], message: "Use native Array/Object methods" },
  { group: ["moment/*"], message: "Use date-fns or Intl" },
  { group: ["axios/*"], message: "Use native fetch" },
  { group: ["embla-carousel-*"], message: "Use Swiper for carousels — Embla is banned" },
];

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/components/ui/**",
      "**/components/pro-blocks/**",
      "**/*.generated.*",
      "**/drizzle.config.ts",
      "legacy/**",
    ],
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: true },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "no-throw-literal": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-restricted-imports": [
        "error",
        { paths: [...BANNED_PATHS], patterns: [...BANNED_PATTERNS] },
      ],
    },
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/lib/env.ts", "**/app/api/**/route.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Use env from @/lib/env instead of process.env directly",
        },
      ],
    },
  },

  {
    files: ["**/app/api/**/route.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportNamedDeclaration > FunctionDeclaration",
          message: "Use withBody/withRoute/withPublicBody/withPublicRoute wrapper from @/lib/api",
        },
        {
          selector: "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
          message: "Use withBody/withRoute/withPublicBody/withPublicRoute wrapper from @/lib/api",
        },
        {
          selector: "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression",
          message: "Use withBody/withRoute/withPublicBody/withPublicRoute wrapper from @/lib/api",
        },
        {
          selector: "ExportNamedDeclaration[declaration=null] > ExportSpecifier",
          message: "Use withBody/withRoute/withPublicBody/withPublicRoute wrapper — do not re-export raw handlers",
        },
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Use env from @/lib/env instead of process.env directly",
        },
      ],
    },
  },

  {
    files: ["apps/landing/**/*.ts", "apps/landing/**/*.tsx"],
    ignores: ["apps/landing/src/content/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...BANNED_PATHS],
          patterns: [
            ...BANNED_PATTERNS,
            {
              group: ["**/content/landing/content", "**/content/landing/content.ts", "@/content/landing/content"],
              message: "Import from @/content/landing (index.ts gate) — never from content.ts. The gate runs parse().",
            },
          ],
        },
      ],
    },
  },

  {
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["apps/*/tsconfig.json"],
        },
      },
      "boundaries/elements": [
        { type: "app", pattern: "src/app", mode: "folder", basePattern: "apps/*" },
        { type: "components", pattern: "src/components", mode: "folder", basePattern: "apps/*" },
        { type: "content", pattern: "src/content", mode: "folder", basePattern: "apps/*" },
        { type: "services", pattern: "src/services", mode: "folder", basePattern: "apps/*" },
        { type: "db", pattern: "src/db", mode: "folder", basePattern: "apps/*" },
        { type: "lib", pattern: "src/lib", mode: "folder", basePattern: "apps/*" },
        { type: "types", pattern: "src/types", mode: "folder", basePattern: "apps/*" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            { from: "components", disallow: ["db", "services", "app"] },
            { from: "db", disallow: ["components", "app", "services", "content"] },
            { from: "types", disallow: ["components", "app", "services", "lib", "db", "content"] },
            { from: "services", disallow: ["components", "app"] },
          ],
        },
      ],
    },
  }
);

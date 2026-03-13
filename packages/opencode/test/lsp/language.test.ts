import { describe, expect, test } from "bun:test"
import { LANGUAGE_EXTENSIONS } from "../../src/lsp/language"

describe("LANGUAGE_EXTENSIONS", () => {
  test("is a non-empty object", () => {
    expect(typeof LANGUAGE_EXTENSIONS).toBe("object")
    expect(LANGUAGE_EXTENSIONS).not.toBeNull()
    expect(Object.keys(LANGUAGE_EXTENSIONS).length).toBeGreaterThan(0)
  })

  const cases: [string, string][] = [
    // Common programming languages
    [".ts", "typescript"],
    [".tsx", "typescriptreact"],
    [".mts", "typescript"],
    [".cts", "typescript"],
    [".mtsx", "typescriptreact"],
    [".ctsx", "typescriptreact"],
    [".js", "javascript"],
    [".jsx", "javascriptreact"],
    [".mjs", "javascript"],
    [".cjs", "javascript"],
    [".py", "python"],
    [".rs", "rust"],
    [".go", "go"],
    [".java", "java"],
    [".cs", "csharp"],
    [".cpp", "cpp"],
    [".cxx", "cpp"],
    [".cc", "cpp"],
    [".c++", "cpp"],
    [".c", "c"],
    [".rb", "ruby"],
    [".rake", "ruby"],
    [".gemspec", "ruby"],
    [".ru", "ruby"],
    [".erb", "erb"],
    [".html.erb", "erb"],
    [".js.erb", "erb"],
    [".css.erb", "erb"],
    [".json.erb", "erb"],
    [".swift", "swift"],
    [".kt", "kotlin"],
    [".kts", "kotlin"],
    [".scala", "scala"],
    [".clj", "clojure"],
    [".cljs", "clojure"],
    [".cljc", "clojure"],
    [".edn", "clojure"],
    [".hs", "haskell"],
    [".lhs", "haskell"],
    [".fs", "fsharp"],
    [".fsi", "fsharp"],
    [".fsx", "fsharp"],
    [".fsscript", "fsharp"],
    [".ex", "elixir"],
    [".exs", "elixir"],
    [".erl", "erlang"],
    [".ets", "typescript"],
    [".hrl", "erlang"],
    [".dart", "dart"],
    [".lua", "lua"],
    [".r", "r"],
    [".jl", "julia"],
    [".ml", "ocaml"],
    [".mli", "ocaml"],
    [".zig", "zig"],
    [".zon", "zig"],
    [".gleam", "gleam"],
    // Web
    [".html", "html"],
    [".htm", "html"],
    [".css", "css"],
    [".scss", "scss"],
    [".sass", "sass"],
    [".less", "less"],
    [".vue", "vue"],
    [".svelte", "svelte"],
    [".astro", "astro"],
    // Markup / Data
    [".json", "json"],
    [".yaml", "yaml"],
    [".yml", "yaml"],
    [".xml", "xml"],
    [".md", "markdown"],
    [".markdown", "markdown"],
    [".tex", "latex"],
    [".latex", "latex"],
    // Shell / Scripts
    [".sh", "shellscript"],
    [".bash", "shellscript"],
    [".zsh", "shellscript"],
    [".ksh", "shellscript"],
    [".ps1", "powershell"],
    [".psm1", "powershell"],
    [".bat", "bat"],
    // Config / DevOps
    [".ini", "ini"],
    [".dockerfile", "dockerfile"],
    [".sql", "sql"],
    [".tf", "terraform"],
    [".tfvars", "terraform-vars"],
    [".hcl", "hcl"],
    [".nix", "nix"],
    // Other
    [".php", "php"],
    [".pl", "perl"],
    [".pm", "perl"],
    [".pm6", "perl6"],
    [".coffee", "coffeescript"],
    [".groovy", "groovy"],
    [".d", "d"],
    [".pas", "pascal"],
    [".pascal", "pascal"],
    [".diff", "diff"],
    [".patch", "diff"],
    [".abap", "abap"],
    [".bib", "bibtex"],
    [".bibtex", "bibtex"],
    [".shader", "shaderlab"],
    [".pug", "jade"],
    [".jade", "jade"],
    [".cshtml", "razor"],
    [".razor", "razor"],
    [".m", "objective-c"],
    [".mm", "objective-cpp"],
    [".xsl", "xsl"],
    [".gitcommit", "git-commit"],
    [".gitrebase", "git-rebase"],
    [".hbs", "handlebars"],
    [".handlebars", "handlebars"],
    [".makefile", "makefile"],
    ["makefile", "makefile"],
    [".typ", "typst"],
    [".typc", "typst"],
  ]

  for (const [ext, expected] of cases) {
    test(`${ext} → ${expected}`, () => {
      expect(LANGUAGE_EXTENSIONS[ext]).toBe(expected)
    })
  }

  test("unknown extension returns undefined (fallback to plaintext in client)", () => {
    expect(LANGUAGE_EXTENSIONS[".unknown_ext_xyz"]).toBeUndefined()
    expect(LANGUAGE_EXTENSIONS[""]).toBeUndefined()
  })

  test("all values are non-empty strings", () => {
    for (const [key, val] of Object.entries(LANGUAGE_EXTENSIONS)) {
      expect(typeof val).toBe("string")
      expect(val.length).toBeGreaterThan(0)
    }
  })

  test("all keys are non-empty strings", () => {
    for (const key of Object.keys(LANGUAGE_EXTENSIONS)) {
      expect(typeof key).toBe("string")
      // key can be just "makefile" (no dot) or ".ext" form
      expect(key.length).toBeGreaterThan(0)
    }
  })
})

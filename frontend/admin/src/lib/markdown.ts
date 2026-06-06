import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/core";
import langBash from "highlight.js/lib/languages/bash";
import langCss from "highlight.js/lib/languages/css";
import langHtml from "highlight.js/lib/languages/xml";
import langJs from "highlight.js/lib/languages/javascript";
import langJson from "highlight.js/lib/languages/json";
import langPhp from "highlight.js/lib/languages/php";
import langPython from "highlight.js/lib/languages/python";
import langSql from "highlight.js/lib/languages/sql";
import langTs from "highlight.js/lib/languages/typescript";

hljs.registerLanguage("bash", langBash);
hljs.registerLanguage("sh", langBash);
hljs.registerLanguage("shell", langBash);
hljs.registerLanguage("css", langCss);
hljs.registerLanguage("html", langHtml);
hljs.registerLanguage("xml", langHtml);
hljs.registerLanguage("javascript", langJs);
hljs.registerLanguage("js", langJs);
hljs.registerLanguage("json", langJson);
hljs.registerLanguage("php", langPhp);
hljs.registerLanguage("python", langPython);
hljs.registerLanguage("py", langPython);
hljs.registerLanguage("sql", langSql);
hljs.registerLanguage("typescript", langTs);
hljs.registerLanguage("ts", langTs);

const buildCodeBlock = (str: string, lang: string): string => {
	let highlighted: string;
	let detectedLang = lang;

	if (lang && hljs.getLanguage(lang)) {
		highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
	} else {
		const result = hljs.highlightAuto(str);
		highlighted = result.value;
		detectedLang = result.language ?? "";
	}

	const langClass = detectedLang ? ` language-${detectedLang}` : "";
	return `<pre class="s-code-block${langClass}"><code class="hljs${langClass}">${highlighted}</code></pre>\n`;
};

const markdown = new MarkdownIt({
	html: true,
	linkify: true,
	breaks: false,
	highlight: buildCodeBlock,
});

// Indented code blocks (4 spaces) bypass the highlight callback — handle them explicitly.
markdown.renderer.rules.code_block = (tokens, idx) => {
	return buildCodeBlock(tokens[idx].content, "");
};

const defaultLinkOpen =
	markdown.renderer.rules.link_open ??
	((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
	const token = tokens[idx];
	const targetIndex = token.attrIndex("target");
	const relIndex = token.attrIndex("rel");

	if (targetIndex < 0) token.attrPush(["target", "_blank"]);
	else token.attrs![targetIndex][1] = "_blank";

	if (relIndex < 0) token.attrPush(["rel", "noopener noreferrer"]);
	else token.attrs![relIndex][1] = "noopener noreferrer";

	return defaultLinkOpen(tokens, idx, options, env, self);
};

const allowedTags = new Set([
	"A",
	"BLOCKQUOTE",
	"BR",
	"CODE",
	"DEL",
	"DIV",
	"EM",
	"H1",
	"H2",
	"H3",
	"H4",
	"H5",
	"H6",
	"HR",
	"IMG",
	"KBD",
	"LI",
	"OL",
	"P",
	"PRE",
	"S",
	"SPAN",
	"STRONG",
	"SUB",
	"SUP",
	"TABLE",
	"TBODY",
	"TD",
	"TH",
	"THEAD",
	"TR",
	"UL",
]);

const globalAllowedAttributes = new Set(["class"]);
const tagAllowedAttributes = new Map([
	["A", new Set(["href", "rel", "target", "title"])],
	["IMG", new Set(["alt", "src", "title"])],
	["TD", new Set(["align"])],
	["TH", new Set(["align"])],
]);

const isSafeUrl = (value: string) => {
	if (value.startsWith("#") || value.startsWith("/")) return true;

	try {
		const url = new URL(value, window.location.origin);
		return ["http:", "https:", "mailto:"].includes(url.protocol);
	} catch {
		return false;
	}
};

const sanitizeElement = (element: Element) => {
	if (!allowedTags.has(element.tagName)) {
		element.replaceWith(...Array.from(element.childNodes));
		return;
	}
	// markdown-it renders table column alignment as style="text-align:..." — convert to align="..."
	// before the attr-filter runs, since style is not in the allowlist but align is.
	if ((element.tagName === "TD" || element.tagName === "TH") && element.hasAttribute("style")) {
		const match = (element.getAttribute("style") ?? "").match(/text-align:\s*(left|center|right)/);
		if (match) element.setAttribute("align", match[1]);
	}

	const allowedAttributes = tagAllowedAttributes.get(element.tagName) ?? new Set<string>();
	Array.from(element.attributes).forEach((attribute) => {
		const name = attribute.name.toLowerCase();
		const value = attribute.value.trim();
		const isAllowed = globalAllowedAttributes.has(name) || allowedAttributes.has(name);
		const isUrlAttribute = name === "href" || name === "src";

		if (!isAllowed || name.startsWith("on") || (isUrlAttribute && !isSafeUrl(value))) {
			element.removeAttribute(attribute.name);
		}
	});

	if (element.tagName === "A") {
		element.setAttribute("target", "_blank");
		element.setAttribute("rel", "noopener noreferrer");
	}
};

const sanitizeHtml = (html: string) => {
	const template = document.createElement("template");
	template.innerHTML = html;

	Array.from(template.content.querySelectorAll("*")).forEach(sanitizeElement);

	return template.innerHTML;
};

export const renderMarkdownContent = (content: string) => {
	return sanitizeHtml(markdown.render(content));
};

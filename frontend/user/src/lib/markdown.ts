import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
	html: true,
	linkify: true,
	breaks: false,
});

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
	"STRONG",
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

	const allowedAttributes = tagAllowedAttributes.get(element.tagName) ?? new Set<string>();
	Array.from(element.attributes).forEach((attribute) => {
		const name = attribute.name.toLowerCase();
		const value = attribute.value.trim();
		const isAllowed =
			globalAllowedAttributes.has(name) || allowedAttributes.has(name);
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

const truncateText = (text: string, maxLength: number) => {
	const sliced = text.slice(0, maxLength).trimEnd();
	const lastSpaceIndex = sliced.lastIndexOf(" ");
	const shouldUseWordBoundary = lastSpaceIndex > Math.floor(maxLength * 0.6);
	const truncated = shouldUseWordBoundary ? sliced.slice(0, lastSpaceIndex) : sliced;

	return `${truncated}...`;
};

const truncateHtmlByText = (html: string, maxLength: number) => {
	const template = document.createElement("template");
	template.innerHTML = html;

	let remaining = maxLength;
	let didTruncate = false;

	const truncateNode = (node: Node): boolean => {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent ?? "";

			if (text.length <= remaining) {
				remaining -= text.length;
				return false;
			}

			node.textContent = truncateText(text, Math.max(0, remaining));
			didTruncate = true;
			remaining = 0;

			return true;
		}

		const children = Array.from(node.childNodes);
		for (let index = 0; index < children.length; index += 1) {
			const child = children[index];
			const shouldStop = truncateNode(child);

			if (shouldStop) {
				children.slice(index + 1).forEach((sibling) => sibling.remove());
				return true;
			}
		}

		return false;
	};

	truncateNode(template.content);

	return {
		html: template.innerHTML,
		didTruncate,
	};
};

export const renderMarkdownContent = (content: string) => {
	return sanitizeHtml(markdown.render(content));
};

export const renderMarkdownPreview = (content: string, maxLength: number) => {
	return truncateHtmlByText(renderMarkdownContent(content), maxLength);
};

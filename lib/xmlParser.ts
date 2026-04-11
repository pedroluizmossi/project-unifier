// --- XML Parser: Pure function that converts XML string to XmlNode tree ---

export type XmlNode =
  | {
      type: 'element';
      tagName: string;
      attributes: string;
      children: XmlNode[];
      selfClosing: boolean;
      id: string;
    }
  | {
      type: 'text';
      content: string;
      id: string;
    }
  | {
      type: 'cdata';
      content: string;
      id: string;
    }
  | {
      type: 'declaration';
      content: string;
      id: string;
    }
  | {
      type: 'error';
      content: string;
      errorMessage: string;
      id: string;
    };

/**
 * Generates a hierarchical deterministic ID for a node.
 * Format: parent/tagName[index]
 * For text/cdata/declaration/error nodes: parent/#text[index], parent/#cdata[index], etc.
 */
function generateId(
  parentPath: string,
  name: string,
  siblingCounts: Map<string, number>
): string {
  const count = siblingCounts.get(name) ?? 0;
  siblingCounts.set(name, count + 1);
  const segment = `${name}[${count}]`;
  return parentPath ? `${parentPath}/${segment}` : segment;
}

/**
 * State-based XML parser. Processes the input character-by-character,
 * accumulating tag content across lines to handle multi-line tags.
 * Returns a flat-or-nested tree of XmlNode.
 */
export function parseXml(xml: string): XmlNode[] {
  if (!xml || xml.trim().length === 0) {
    return [];
  }

  const root: XmlNode[] = [];

  // Stack of open elements: each entry holds the element node and its sibling counters
  const stack: Array<{
    node: Extract<XmlNode, { type: 'element' }>;
    childCounts: Map<string, number>;
  }> = [];

  // Sibling counters for the root level
  let rootChildCounts = new Map<string, number>();

  const currentChildren = (): XmlNode[] => {
    if (stack.length === 0) return root;
    return stack[stack.length - 1].node.children;
  };

  const currentChildCounts = (): Map<string, number> => {
    if (stack.length === 0) return rootChildCounts;
    return stack[stack.length - 1].childCounts;
  };

  const currentPath = (): string => {
    if (stack.length === 0) return '';
    return stack[stack.length - 1].node.id;
  };

  const addNode = (node: XmlNode): void => {
    currentChildren().push(node);
  };

  const addErrorNode = (content: string, errorMessage: string): void => {
    const id = generateId(currentPath(), '#error', currentChildCounts());
    addNode({ type: 'error', content, errorMessage, id });
  };

  let i = 0;
  const len = xml.length;

  while (i < len) {
    // Skip pure whitespace between tags at the current position
    // but only if the next non-whitespace is '<'
    let j = i;
    while (j < len && (xml[j] === ' ' || xml[j] === '\t' || xml[j] === '\n' || xml[j] === '\r')) {
      j++;
    }

    if (j < len && xml[j] === '<') {
      // We have a tag coming — skip whitespace
      i = j;
    } else if (j >= len) {
      // Only whitespace left — check if it's meaningful text
      const remaining = xml.substring(i).trim();
      if (remaining.length > 0) {
        const id = generateId(currentPath(), '#text', currentChildCounts());
        addNode({ type: 'text', content: remaining, id });
      }
      break;
    }
    // else: non-whitespace, non-'<' — it's text content

    if (i < len && xml[i] === '<') {
      // --- CDATA section ---
      if (xml.startsWith('<![CDATA[', i)) {
        const cdataStart = i + 9; // after '<![CDATA['
        const cdataEnd = xml.indexOf(']]>', cdataStart);
        if (cdataEnd === -1) {
          // Unclosed CDATA
          addErrorNode(xml.substring(i), 'Unclosed CDATA section');
          i = len;
          continue;
        }
        const content = xml.substring(cdataStart, cdataEnd);
        const id = generateId(currentPath(), '#cdata', currentChildCounts());
        addNode({ type: 'cdata', content, id });
        i = cdataEnd + 3; // skip ']]>'
        continue;
      }

      // --- Comment ---
      if (xml.startsWith('<!--', i)) {
        const commentEnd = xml.indexOf('-->', i + 4);
        if (commentEnd === -1) {
          addErrorNode(xml.substring(i), 'Unclosed comment');
          i = len;
          continue;
        }
        // Skip comments entirely
        i = commentEnd + 3;
        continue;
      }

      // --- XML Declaration <?...?> ---
      if (xml.startsWith('<?', i)) {
        const declEnd = xml.indexOf('?>', i + 2);
        if (declEnd === -1) {
          addErrorNode(xml.substring(i), 'Unclosed XML declaration');
          i = len;
          continue;
        }
        const content = xml.substring(i, declEnd + 2);
        const id = generateId(currentPath(), '#declaration', currentChildCounts());
        addNode({ type: 'declaration', content, id });
        i = declEnd + 2;
        continue;
      }

      // --- Closing tag </...> ---
      if (xml.startsWith('</', i)) {
        // Accumulate until '>'
        const closeEnd = xml.indexOf('>', i + 2);
        if (closeEnd === -1) {
          addErrorNode(xml.substring(i), 'Unclosed closing tag');
          i = len;
          continue;
        }
        const tagName = xml.substring(i + 2, closeEnd).trim();
        i = closeEnd + 1;

        // Pop from stack
        if (stack.length === 0) {
          addErrorNode(`</${tagName}>`, `Unexpected closing tag </${tagName}> with no matching open tag`);
          continue;
        }

        const top = stack[stack.length - 1];
        if (top.node.tagName !== tagName) {
          // Mismatched closing tag
          addErrorNode(
            `</${tagName}>`,
            `Mismatched closing tag: expected </${top.node.tagName}>, found </${tagName}>`
          );
          // Pop the mismatched element anyway to try to recover
          stack.pop();
          continue;
        }

        // Properly matched — pop
        stack.pop();
        continue;
      }

      // --- Opening or self-closing tag <...> or <.../> ---
      // Accumulate characters until we find '>' that closes the tag.
      // We need to handle '>' inside attribute values (quoted).
      i++; // skip '<'
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let tagContent = '<';

      while (i < len) {
        const ch = xml[i];
        if (inSingleQuote) {
          tagContent += ch;
          if (ch === "'") inSingleQuote = false;
          i++;
          continue;
        }
        if (inDoubleQuote) {
          tagContent += ch;
          if (ch === '"') inDoubleQuote = false;
          i++;
          continue;
        }
        if (ch === "'") {
          inSingleQuote = true;
          tagContent += ch;
          i++;
          continue;
        }
        if (ch === '"') {
          inDoubleQuote = true;
          tagContent += ch;
          i++;
          continue;
        }
        if (ch === '>') {
          tagContent += ch;
          i++;
          break;
        }
        tagContent += ch;
        i++;
      }

      // Check if we ran out of input without closing the tag
      if (!tagContent.endsWith('>')) {
        addErrorNode(tagContent, 'Unclosed tag');
        continue;
      }

      const isSelfClosing = tagContent.endsWith('/>');

      // Parse tag name and attributes from tagContent
      // tagContent is like: <tagName attr1="val" attr2="val"> or <tagName />
      const inner = isSelfClosing
        ? tagContent.slice(1, -2) // remove < and />
        : tagContent.slice(1, -1); // remove < and >

      // Extract tag name (first token)
      const firstSpace = inner.search(/[\s\n\r]/);
      let tagName: string;
      let attributes: string;
      if (firstSpace === -1) {
        tagName = inner.trim();
        attributes = '';
      } else {
        tagName = inner.substring(0, firstSpace);
        attributes = inner.substring(firstSpace).trim();
      }

      // Validate tag name
      if (!tagName || tagName.startsWith('!') || tagName.startsWith('?')) {
        addErrorNode(tagContent, `Invalid tag: ${tagContent}`);
        continue;
      }

      const id = generateId(currentPath(), tagName, currentChildCounts());

      if (isSelfClosing) {
        addNode({
          type: 'element',
          tagName,
          attributes,
          children: [],
          selfClosing: true,
          id,
        });
      } else {
        const elementNode: Extract<XmlNode, { type: 'element' }> = {
          type: 'element',
          tagName,
          attributes,
          children: [],
          selfClosing: false,
          id,
        };
        addNode(elementNode);
        stack.push({ node: elementNode, childCounts: new Map() });
      }
      continue;
    }

    // --- Text content (not starting with '<') ---
    const textStart = i;
    while (i < len && xml[i] !== '<') {
      i++;
    }
    const textContent = xml.substring(textStart, i);
    // Only add non-empty text nodes (but preserve meaningful whitespace)
    const trimmed = textContent.trim();
    if (trimmed.length > 0) {
      const id = generateId(currentPath(), '#text', currentChildCounts());
      addNode({ type: 'text', content: trimmed, id });
    }
  }

  // Check for unclosed tags remaining on the stack
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    // Add error node at the parent level for the unclosed tag
    const parentChildren = stack.length > 0 ? stack[stack.length - 1].node.children : root;
    const parentPath = stack.length > 0 ? stack[stack.length - 1].node.id : '';
    const parentCounts = stack.length > 0 ? stack[stack.length - 1].childCounts : rootChildCounts;
    const errorId = generateId(parentPath, '#error', parentCounts);
    parentChildren.push({
      type: 'error',
      content: `<${unclosed.node.tagName}>`,
      errorMessage: `Unclosed tag <${unclosed.node.tagName}>`,
      id: errorId,
    });
  }

  return root;
}

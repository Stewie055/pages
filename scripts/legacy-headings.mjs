export default function legacyHeadings() {
  return tree => {
    const walk = node => {
      if (!node.children) return;
      for (let i = 0; i < node.children.length - 1; i++) {
        const current = node.children[i];
        const next = node.children[i + 1];
        const html = current.type === 'html' ? current.value : current.type === 'paragraph' && current.children.every(child => child.type === 'html') ? current.children.map(child => child.value).join('') : '';
        const id = html.match(/^<a id="([^"]+)"><\/a>$/)?.[1];
        if (id && next.type === 'heading') {
          next.data = { ...next.data, hProperties: { ...next.data?.hProperties, id } };
          node.children.splice(i, 1);
          i--;
        }
      }
      node.children.forEach(walk);
    };
    walk(tree);
  };
}

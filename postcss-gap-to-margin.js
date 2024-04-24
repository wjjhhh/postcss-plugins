import postcss from "postcss";

const isExclude = (reg, file) => {
  if (Object.prototype.toString.call(reg) !== "[object RegExp]") {
    throw new Error("options.exclude should be RegExp.");
  }
  return file.match(reg) !== null;
};

const postcssGapToMargin = (opts) => {
  return {
    postcssPlugin: "postcss-gap-to-margin",
    Once(css, { result }) {
      css.walkRules((rule) => {
        const file = rule.source?.input.file || "";

        if (opts.exclude && file) {
          if (
            Object.prototype.toString.call(opts.exclude) === "[object RegExp]"
          ) {
            if (isExclude(opts.exclude, file)) return;
          } else if (
            // Object.prototype.toString.call(opts.exclude) === '[object Array]' &&
            opts.exclude instanceof Array
          ) {
            for (let i = 0; i < opts.exclude.length; i++) {
              if (isExclude(opts.exclude[i], file)) return;
            }
          } else {
            throw new Error("options.exclude should be RegExp or Array.");
          }
        }
        // 检查该元素的 display 是否为 'flex'
        let isFlex = false;
        // 是否有gap属性值
        let hasGap = false;
        let gapValue = 0;
        let classname = "";
        let execute = () => {};
        rule.walkDecls((decl) => {
          if (decl.prop === "gap") {
            hasGap = true;
            gapValue = decl.value;
            execute = () => {
              decl.remove();
            };

            classname = decl.parent.selector;
          } else if (
            decl.prop === "display" &&
            ["flex", "inline-flex"].includes(decl.value)
          ) {
            isFlex = true;
          }
        });
        if (isFlex && hasGap) {
          const newRule = postcss.rule({
            selector: `${classname} > *:not(:last-child), ${classname} > *:only-child`,
            raw: { semicolon: true },
          });
          execute();
          newRule.append({
            prop: "margin-right",
            value: gapValue,
          });
          rule.after(newRule);
        }
      });
    },
    // Declaration(decl) {
    //     console.log('Declaration', decl)
    // }
  };
};

export default postcssGapToMargin;

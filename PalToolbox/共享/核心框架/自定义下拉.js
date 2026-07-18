window.PT_initCustomSelects = function PT_initCustomSelects(root) {
    if (!root) return;
    var allSelects = root.querySelectorAll('select.pt-select');
    allSelects.forEach(function(nativeSelect) {
        if (nativeSelect.closest('.pt-custom-select')) return;
        if (nativeSelect.classList.contains('pt-theme-grid-native')) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'pt-custom-select';

        var trigger = document.createElement('div');
        trigger.className = 'pt-custom-select__trigger';

        var panel = document.createElement('div');
        panel.className = 'pt-custom-select__panel';

        renderCustomSelectOptions(nativeSelect, trigger, panel);

        nativeSelect.parentNode.insertBefore(wrapper, nativeSelect);
        wrapper.appendChild(nativeSelect);
        wrapper.appendChild(trigger);
        wrapper.appendChild(panel);

        updateTrigger(nativeSelect, trigger);
        nativeSelect.addEventListener('change', function() {
            updateTrigger(nativeSelect, trigger);
        });
    });

    // Close on outside click
    if (!window._ptSelectClickBound) {
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.pt-custom-select')) {
                document.querySelectorAll('.pt-custom-select--open').forEach(function(el) {
                    el.classList.remove('pt-custom-select--open');
                    if (window.PT_initCustomScrollbars) window.PT_initCustomScrollbars(el);
                });
            }
        });
        window._ptSelectClickBound = true;
    }
};

window.PT_refreshCustomSelect = function PT_refreshCustomSelect(nativeSelect) {
    var wrapper = nativeSelect.closest('.pt-custom-select');
    if (!wrapper) return;

    var trigger = wrapper.querySelector('.pt-custom-select__trigger');
    var panel = wrapper.querySelector('.pt-custom-select__panel');
    if (!trigger || !panel) return;

    panel.innerHTML = '';
    renderCustomSelectOptions(nativeSelect, trigger, panel);

    updateTrigger(nativeSelect, trigger);
    if (window.PT_initCustomScrollbars) window.PT_initCustomScrollbars(wrapper);
};

function renderCustomSelectOptions(nativeSelect, trigger, panel) {
    Array.prototype.forEach.call(nativeSelect.children, function(child) {
        var tagName = child.tagName.toLowerCase();
        if (tagName === 'option') {
            panel.appendChild(makeOption(child, nativeSelect, trigger, panel));
            return;
        }
        if (tagName === 'optgroup') {
            var groupLabel = document.createElement('div');
            groupLabel.className = 'pt-custom-select__group-label';
            groupLabel.textContent = child.label;
            panel.appendChild(groupLabel);

            child.querySelectorAll('option').forEach(function(opt) {
                panel.appendChild(makeOption(opt, nativeSelect, trigger, panel));
            });
        }
    });
}

function updateTrigger(nativeSelect, trigger) {
    var selected = nativeSelect.options[nativeSelect.selectedIndex];
    trigger.textContent = selected && selected.textContent ? selected.textContent : '';
    if (selected && selected.hidden) {
        trigger.classList.add('pt-custom-select__trigger--placeholder');
    } else {
        trigger.classList.remove('pt-custom-select__trigger--placeholder');
    }
}

function makeOption(opt, nativeSelect, trigger, panel) {
    var div = document.createElement('div');
    div.className = 'pt-custom-select__option';
    div.textContent = opt.textContent;

    if (opt.hidden) {
        div.style.display = 'none';
    }

    div.addEventListener('click', function(e) {
        e.stopPropagation();
        var oldVal = nativeSelect.value;
        nativeSelect.value = opt.value;
        updateTrigger(nativeSelect, trigger);
        panel.parentElement.classList.remove('pt-custom-select--open');
        if (window.PT_initCustomScrollbars) window.PT_initCustomScrollbars(panel.parentElement);

        if (nativeSelect.value !== oldVal) {
            nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    return div;
}

// Click trigger to toggle panel
document.addEventListener('click', function(e) {
    var trigger = e.target.closest('.pt-custom-select__trigger');
    if (!trigger) return;
    var wrapper = trigger.parentElement;
    var nativeSelect = wrapper.querySelector('select.pt-select');
    if (nativeSelect && nativeSelect.disabled) return;

    var wasOpen = wrapper.classList.contains('pt-custom-select--open');

    document.querySelectorAll('.pt-custom-select--open').forEach(function(el) {
        el.classList.remove('pt-custom-select--open');
        if (window.PT_initCustomScrollbars) window.PT_initCustomScrollbars(el);
    });

    if (!wasOpen) {
        wrapper.classList.add('pt-custom-select--open');
    }
    if (window.PT_initCustomScrollbars) window.PT_initCustomScrollbars(wrapper);
});

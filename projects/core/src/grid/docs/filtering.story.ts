/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { html, LitElement } from 'lit';
import pipe from 'ramda/es/pipe.js';
import { state, customElement } from '@cds/core/internal';
import { filter, getVMData, TestVM, StatusDisplayType, StatusIconType } from '@cds/core/demo';
import '@cds/core/grid/register.js';

export function filtering() {
  interface GridState {
    data: TestVM[];
    orderPreference: string[];
    search: string;
    statusFilter: string;
    idFilterAnchor: HTMLElement | null;
  }

  const initialState: GridState = {
    data: getVMData(),
    orderPreference: getVMData().map(vm => vm.id),
    search: '',
    statusFilter: '',
    idFilterAnchor: null,
  };

  @customElement('demo-grid-filtering')
  class DemoFiltering extends LitElement {
    @state() private state: GridState = initialState;

    get selected() {
      return this.state.data.filter(i => i.selected).length;
    }

    render() {
      return html`
        <div cds-layout="vertical gap:md">
          <cds-search control-width="shrink">
            <input
              type="search"
              placeholder="Search"
              aria-label="search rows"
              .value=${this.state.search}
              @input=${(e: any) => this.search(e.target.value)}
            />
          </cds-search>
          <cds-grid aria-label="Active VM Management" range-selection="false" height="360">
            <cds-grid-column width="180">
              Host
              <cds-button-action
                popup="id-filter"
                @click=${(e: any) => (this.state = { ...this.state, idFilterAnchor: e.target })}
                aria-label="column filter options"
                shape="filter"
                .expanded=${!!this.state.search}
              ></cds-button-action>
            </cds-grid-column>

            <cds-grid-column> Status </cds-grid-column>
            <cds-grid-column>CPU</cds-grid-column>
            <cds-grid-column>Memory</cds-grid-column>
            <cds-grid-row position="sticky">
              <cds-grid-cell @keyup=${(e: any) => this.toggleFilter(e)} @click=${(e: any) => this.toggleFilter(e)}>
                <cds-input>
                  <input
                    placeholder="Search"
                    aria-label="search rows"
                    .value=${this.state.search}
                    @input=${(e: any) => this.search(e.target.value)}
                    @blur=${(e: any) => this.toggleFilter(e)}
                  />
                </cds-input>
              </cds-grid-cell>
              <cds-grid-cell @click=${(e: any) => this.toggleFilter(e)} @keyup=${(e: any) => this.toggleFilter(e)}>
                <cds-select>
                  <select
                    aria-label="filter on status"
                    @input=${(e: any) => this.filterStatus(e.target.value)}
                    @blur=${(e: any) => this.toggleFilter(e)}
                  >
                    ${['', 'online', 'disruption', 'offline', 'deactivated'].map(
                      s => html` <option value="${s}" .checked="${this.state.statusFilter === s}">${s}</option> `
                    )}
                  </select>
                </cds-select>
              </cds-grid-cell>
              <cds-grid-cell></cds-grid-cell>
              <cds-grid-cell></cds-grid-cell>
            </cds-grid-row>
            ${this.sortedData.map(
              entry => html` <cds-grid-row>
                <cds-grid-cell>${entry.id}</cds-grid-cell>
                <cds-grid-cell>
                  <cds-tag status=${StatusDisplayType[entry.status]} readonly>
                    <cds-icon
                      shape=${StatusIconType[entry.status]}
                      inner-offset=${entry.status === 'deactivated' ? 0 : 3}
                    ></cds-icon>
                    ${entry.status}
                  </cds-tag>
                </cds-grid-cell>
                <cds-grid-cell>${entry.cpu}%</cds-grid-cell>
                <cds-grid-cell>${entry.memory}%</cds-grid-cell>
              </cds-grid-row>`
            )}
            <cds-grid-footer>
              <div cds-layout="display:screen-reader-only" aria-live="polite" aria-relevant="all" role="status">
                filtering on host ${this.state.search}, status ${this.state.statusFilter}
              </div>
            </cds-grid-footer>
          </cds-grid>
        </div>
        <cds-dropdown
          id="id-filter"
          ?hidden=${!this.state.idFilterAnchor}
          @closeChange=${() => (this.state = { ...this.state, idFilterAnchor: null as any })}
          .anchor=${this.state.idFilterAnchor}
        >
          <div cds-layout="vertical align:stretch p:sm">
            <cds-input>
              <input
                type="text"
                placeholder="Search"
                aria-label="search rows"
                .value=${this.state.search}
                @input=${(e: any) => this.search(e.target.value)}
              />
            </cds-input>
          </div>
        </cds-dropdown>
      `;
    }

    private toggleFilter(e: any) {
      e.stopPropagation();
      const cell = e.currentTarget ?? e.target.closest('cds-grid-cell');

      console.log({ type: e.type, code: e.code, e });

      if (!cell.hasAttribute('cds-editing') && (e.code === 'Enter' || e.type === 'click')) {
        cell.setAttribute('cds-editing', '');
        const input = cell.querySelector('input, select');
        input?.focus();
      } else if (cell.hasAttribute('cds-editing') && (e.code === 'Enter' || e.code === 'Escape' || e.type === 'blur')) {
        cell.removeAttribute('cds-editing');
        cell.focus();
      }
    }

    private get sortedData() {
      return pipe(
        (d: TestVM[]) =>
          d.sort((a, b) =>
            this.state.orderPreference.indexOf(a.id) > this.state.orderPreference.indexOf(b.id) ? 1 : -1
          ),
        d => filter<TestVM>(d, 'id', this.state.search),
        d => filter<TestVM>(d, 'status', this.state.statusFilter)
      )([...this.state.data]);
    }

    private search(value: string) {
      this.state = { ...this.state, search: value };
    }

    private filterStatus(value: string) {
      this.state = { ...this.state, statusFilter: value };
    }

    protected createRenderRoot() {
      return this;
    }
  }
  return html`<demo-grid-filtering></demo-grid-filtering>`;
}

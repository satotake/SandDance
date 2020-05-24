// Copyright (c) satotake
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel, DOMWidgetView, ISerializers
} from '@jupyter-widgets/base';

import {
  MODULE_NAME, MODULE_VERSION
} from './version';

import * as deck from '@deck.gl/core';
import * as layers from '@deck.gl/layers';
import * as luma from 'luma.gl';
import * as fabric from 'office-ui-fabric-react';
import * as vega from 'vega';
import { Explorer, use } from '@msrvida/sanddance-explorer';
import ReactDOM from 'react-dom'
import React from 'react'

import '../css/widget.css'

// TODO
use(fabric as any, vega, deck as any, layers, luma);
fabric.initializeIcons();

export class SandDanceModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: SandDanceModel.model_name,
      _model_module: SandDanceModel.model_module,
      _model_module_version: SandDanceModel.model_module_version,
      _view_name: SandDanceModel.view_name,
      _view_module: SandDanceModel.view_module,
      _view_module_version: SandDanceModel.view_module_version,
      value : '[]',  // json string
      width : '100%',
      heigth : '60vh',
      snapshots: [],
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  }

  static model_name = 'SandDanceModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'SandDanceView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}


export class SandDanceView extends DOMWidgetView {
  private intervalID?: NodeJS.Timeout
  private explorer?: Explorer
  private wrapper?: React.DetailedReactHTMLElement<any, HTMLElement>


    render () {

      const explorerProps = {
        logoClickUrl: 'https://microsoft.github.io/SandDance/',
        compactUI: true,
        mounted: (explorer: Explorer) => {
          this.explorer = explorer;
          this.model.on('change:value', this.value_changed, this);

          setTimeout(() => {
            this.value_changed();
          }, 1);
        },
        // TODO
        ref: (ref: any) => {
          // restore previoous snapshot states
          ref.state.snapshots = this.model.get('snapshots');
          this.intervalID = this.autosaveSnapshots(ref)
        },
        key: 'explorer-key'
      };

      this.wrapper = React.createElement(
        'div',
        {
          style: {
            width: this.model.get('width'),
            height: this.model.get('height'),
          }
        },
        [React.createElement(Explorer, explorerProps)],
      );

      ReactDOM.render(this.wrapper, this.el);

      this.model.on('change:width', this.size_changed, this);
      this.model.on('change:height', this.size_changed, this);
    }

  // TODO
  autosaveSnapshots (ref: any) {
    return setInterval(() => {
      this.model.set('snapshots', ref.state.snapshots)
      this.model.save_changes();
    }, 1000 * 10);
  }

  size_changed () {
    if (!this.wrapper) {
      return;
    }

    const style = {
      width: this.model.get('width'),
      height: this.model.get('height'),
    };
    this.wrapper.props.style = style;
  }

  value_changed () {
    if (!this.explorer) {
      return;
    }

    this.explorer.load(JSON.parse(this.model.get('value')));
  }

  remove() {
    if (this.intervalID) {
      clearInterval(this.intervalID);
    }
    super.remove();
  }
}

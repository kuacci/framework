﻿
import * as React from 'react'
import { Modal, ModalProps, ModalClass, ButtonToolbar, Button, Sizes } from 'react-bootstrap'
import { openModal, IModalProps } from '../Modals'
import MessageModal from '../Modals/MessageModal'
import * as Navigator from '../Navigator'
import ButtonBar from './ButtonBar'

import { ValidationError } from '../Services'
import { ifError, Dic } from '../Globals'
import { TypeContext, StyleOptions, EntityFrame, IRenderButtons, IHasChanges } from '../TypeContext'
import { Entity, Lite, ModifiableEntity, JavascriptMessage, NormalWindowMessage, toLite, getToString, EntityPack, ModelState, entityInfo, isEntityPack, isLite } from '../Signum.Entities'
import { getTypeInfo, TypeInfo, PropertyRoute, ReadonlyBinding, GraphExplorer, isTypeModel, parseId } from '../Reflection'
import ValidationErrors from './ValidationErrors'
import { renderWidgets, WidgetContext } from './Widgets'
import { needsCanExecute } from '../Operations/EntityOperations'
import { EntityOperationContext } from '../Operations'

import "./Frames.css"
import { ViewPromise } from "../Navigator";

interface FrameModalProps extends React.Props<FrameModal>, IModalProps {
    title?: string;
    entityOrPack: Lite<Entity> | ModifiableEntity | EntityPack<ModifiableEntity>;
    propertyRoute?: PropertyRoute;
    isOperationVisible?: (eoc: EntityOperationContext<any /*Entity*/>) => boolean;
    validate?: boolean;
    requiresSaveOperation?: boolean;
    avoidPromptLooseChange?: boolean;
    extraComponentProps?: {}
    getViewPromise?: (e: ModifiableEntity) => undefined | string | Navigator.ViewPromise<ModifiableEntity>;
    isNavigate?: boolean;
    readOnly?: boolean;
    modalSize?: Sizes;
}

interface FrameModalState {
    pack?: EntityPack<ModifiableEntity>;
    getComponent?: (ctx: TypeContext<ModifiableEntity>) => React.ReactElement<any>;
    propertyRoute?: PropertyRoute;
    show?: boolean;
    refreshCount: number;
}

let modalCount = 0;

export default class FrameModal extends React.Component<FrameModalProps, FrameModalState>  {
    prefix = "modal" + (modalCount++);

    static defaultProps: FrameModalProps = {
        isOperationVisible: undefined,
        entityOrPack: null as any
    }

    constructor(props: FrameModalProps) {
        super(props);
        this.state = this.calculateState(props);
    }

    componentWillMount() {
        Navigator.toEntityPack(this.props.entityOrPack)
            .then(ep => this.setPack(ep))
            .then(() => this.loadComponent())
            .done();
    }

    componentWillReceiveProps(props: FrameModalProps) {
        this.setState(this.calculateState(props));

        Navigator.toEntityPack(props.entityOrPack)
            .then(ep => this.setPack(ep))
            .then(() => this.loadComponent())
            .done();
    }


    getTypeName() {
        return (this.props.entityOrPack as Lite<Entity>).EntityType ||
            (this.props.entityOrPack as ModifiableEntity).Type ||
            (this.props.entityOrPack as EntityPack<ModifiableEntity>).entity.Type;
    }

    getTypeInfo() {
        const typeName = this.getTypeName();

        return getTypeInfo(typeName);
    }

    calculateState(props: FrameModalProps): FrameModalState {

        const typeInfo = this.getTypeInfo();

        const pr = typeInfo ? PropertyRoute.root(typeInfo) : this.props.propertyRoute;

        if (!pr)
            throw new Error("propertyRoute is mandatory for embeddedEntities");

        return {
            propertyRoute: pr,
            show: true,
            refreshCount: 0,
        };
    }



    setPack(pack: EntityPack<ModifiableEntity>): void {
        this.setState({
            pack: pack,
            refreshCount: this.state.refreshCount + 1
        });
    }

    loadComponent() {

        const result = this.props.getViewPromise && this.props.getViewPromise(this.state.pack!.entity);

        var viewPromise = result instanceof ViewPromise ? result : Navigator.getViewPromise(this.state.pack!.entity, result);

        if (this.props.extraComponentProps)
            viewPromise = viewPromise.withProps(this.props.extraComponentProps);

        return viewPromise.promise
            .then(c => this.setState({ getComponent: c }));
    }

    okClicked: boolean;
    handleOkClicked = (val: any) => {
        if (this.hasChanges() &&
            (this.props.requiresSaveOperation != undefined ? this.props.requiresSaveOperation : Navigator.typeRequiresSaveOperation(this.state.pack!.entity.Type))) {
            MessageModal.show({
                title: NormalWindowMessage.ThereAreChanges.niceToString(),
                message: JavascriptMessage.saveChangesBeforeOrPressCancel.niceToString(),
                buttons: "ok",
                style: "warning",
                icon: "warning"
            }).done();
        }
        else {
            if (!this.props.validate) {

                this.okClicked = true;
                this.setState({ show: false });

                return;
            }

            Navigator.API.validateEntity(this.state.pack!.entity)
                .then(() => {
                    this.okClicked = true;
                    this.setState({ show: false });
                }, ifError(ValidationError, e => {
                    GraphExplorer.setModelState(this.state.pack!.entity, e.modelState, "entity");
                    this.forceUpdate();
                })).done();
        }
    }


    handleCancelClicked = () => {

        if (this.hasChanges() && !this.props.avoidPromptLooseChange) {
            MessageModal.show({
                title: NormalWindowMessage.ThereAreChanges.niceToString(),
                message: NormalWindowMessage.LoseChanges.niceToString(),
                buttons: "yes_no",
                style: "warning",
                icon: "warning"
            }).then(result => {
                if (result == "yes") {
                    this.setState({ show: false });
                }
            }).done();
        }
        else {
            this.setState({ show: false });
        }
    }

    hasChanges() {

        var hc = this.entityComponent as IHasChanges;
        if (hc.componentHasChanges)
            return hc.componentHasChanges();

        const entity = this.state.pack!.entity;

        GraphExplorer.propagateAll(entity);

        return entity.modified;
    }

    handleOnExited = () => {
        this.props.onExited!(this.okClicked ? this.state.pack!.entity : undefined);
    }

    render() {

        const pack = this.state.pack;

        return (
            <Modal bsSize={this.props.modalSize || "lg"} onHide= { this.handleCancelClicked } show= { this.state.show } onExited= { this.handleOnExited } className= "sf-popup-control" >
                <Modal.Header closeButton={this.props.isNavigate}>
                    {!this.props.isNavigate && <ButtonToolbar className="pull-right flip">
                        <Button className="sf-entity-button sf-close-button sf-ok-button" bsStyle="primary" disabled={!pack} onClick={this.handleOkClicked}>{JavascriptMessage.ok.niceToString()}</Button>
                        <Button className="sf-entity-button sf-close-button sf-cancel-button" bsStyle="default" disabled={!pack} onClick={this.handleCancelClicked}>{JavascriptMessage.cancel.niceToString()}</Button>
                    </ButtonToolbar>}
                    {this.renderTitle()}
                </Modal.Header>
                {pack && this.renderBody()}
            </Modal>
        );
    }

    entityComponent: React.Component<any, any>;

    setComponent(c: React.Component<any, any>) {
        if (c && this.entityComponent != c) {
            this.entityComponent = c;
            this.forceUpdate();
        }
    }

    renderBody() {

        const frame: EntityFrame = {
            frameComponent: this,
            entityComponent: this.entityComponent,
            onReload: pack => this.setPack(pack || this.state.pack!),
            onClose: (ok?: boolean) => this.props.onExited!(ok ? this.state.pack!.entity : undefined),
            revalidate: () => this.validationErrors && this.validationErrors.forceUpdate(),
            setError: (modelState, initialPrefix = "") => {
                GraphExplorer.setModelState(this.state.pack!.entity, modelState, initialPrefix!);
                this.forceUpdate();
            },
            refreshCount: this.state.refreshCount,
        };

        const pack = this.state.pack!;

        const styleOptions: StyleOptions = {
            readOnly: this.props.readOnly != undefined ? this.props.readOnly : Navigator.isReadOnly(pack),
            frame: frame,
        };

        const ctx = new TypeContext(undefined, styleOptions, this.state.propertyRoute!, new ReadonlyBinding(pack.entity, this.prefix!));

        return (
            <Modal.Body>
                {renderWidgets({ ctx: ctx, pack: pack })}
                {this.entityComponent && <ButtonBar frame={frame} pack={pack} isOperationVisible={this.props.isOperationVisible} />}
                <ValidationErrors entity={pack.entity} ref={ve => this.validationErrors = ve} />
                <div className="sf-main-control form-horizontal" data-test-ticks={new Date().valueOf()} data-main-entity={entityInfo(ctx.value)}>
                    {this.state.getComponent && React.cloneElement(this.state.getComponent(ctx), { ref: (c: React.Component<any, any>) => this.setComponent(c) })}
                </div>
            </Modal.Body>
        );
    }

    validationErrors?: ValidationErrors | null;

    renderTitle() {

        if (!this.state.pack)
            return <h3>{JavascriptMessage.loading.niceToString()}</h3>;

        const entity = this.state.pack.entity;
        const pr = this.props.propertyRoute;

        return (
            <h4>
                <span className="sf-entity-title">{this.props.title || getToString(entity)}</span>&nbsp;
                {this.renderExpandLink()}
                <br />
                <small> {pr && pr.member && pr.member.typeNiceName || Navigator.getTypeTitle(entity, pr)}</small>
            </h4>
        );
    }

    renderExpandLink() {
        const entity = this.state.pack!.entity;

        if (entity == undefined || entity.isNew)
            return undefined;

        const ti = getTypeInfo(entity.Type);

        if (ti == undefined || !Navigator.isNavigable(ti, false)) //Embedded
            return undefined;

        return (
            <a className="sf-popup-fullscreen sf-pointer" onMouseUp={this.handlePopupFullScreen}>
                <span className="glyphicon glyphicon-new-window"></span>
            </a>
        );
    }


    handlePopupFullScreen = (e: React.MouseEvent<any>) => {
        e.preventDefault();
        Navigator.pushOrOpenInTab(Navigator.navigateRoute(this.state.pack!.entity as Entity), e);
    }

    static openView(entityOrPack: Lite<Entity> | ModifiableEntity | EntityPack<ModifiableEntity>, options: Navigator.ViewOptions): Promise<Entity | undefined> {

        return openModal<Entity>(<FrameModal
            entityOrPack={entityOrPack}
            readOnly={options.readOnly}
            modalSize={options.modalSize}
            propertyRoute={options.propertyRoute}
            getViewPromise={options.getViewPromise}
            isOperationVisible={options.isOperationVisible}
            requiresSaveOperation={options.requiresSaveOperation}
            avoidPromptLooseChange={options.avoidPromptLooseChange}
            extraComponentProps={options.extraComponentProps}
            validate={options.validate == undefined ? FrameModal.isModelEntity(entityOrPack) : options.validate}
            title={options.title}
            isNavigate={false} />);
    }

    static isModelEntity(entityOrPack: Lite<Entity> | ModifiableEntity | EntityPack<ModifiableEntity>) {
        const typeName = isEntityPack(entityOrPack) ? entityOrPack.entity.Type :
            isLite(entityOrPack) ? entityOrPack.EntityType : entityOrPack.Type;

        return isTypeModel(typeName);
    }

    static openNavigate(entityOrPack: Lite<Entity> | ModifiableEntity | EntityPack<ModifiableEntity>, options: Navigator.NavigateOptions): Promise<void> {

        return openModal<void>(<FrameModal
            entityOrPack={entityOrPack}
            readOnly={options.readOnly}
            modalSize={options.modalSize}
            propertyRoute={undefined}
            getViewPromise={options.getViewPromise}
            requiresSaveOperation={undefined}
            avoidPromptLooseChange={options.avoidPromptLooseChange}
            extraComponentProps={options.extraComponentProps}
            isNavigate={true} />);
    }
}




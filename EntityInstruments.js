import React, { useState } from 'react';
import { TabbedNav } from 'cabem-react-next';
import { Card, Col, Row, Button } from "react-bootstrap"
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectHeaderDataPending, selectHeaderData } from 'reducers/entityInstrument'
import EntityInstrumentGlobalHeader from 'components/Subcomponents/EntityInstruments/EntityInstrumentGlobalHeader';
import { DateColumn, NoSymbolMoneyColumn, BooleanColumn, AccountingColumn, PercentColumn } from 'utilities/Formatters/FormattedColumns';
import { NumberFormatter } from "utilities/Formatters/";
const { MONEY } = NumberFormatter;
import {
    EntityInstrumentPositionsDataGrid,
    PositionScheduledActivitiesDataGrid,
    EntityInstrumentPrincipalActivitiesDataGrid,
    HistoryDataGrid,
    EntityInstrumentCashGrid,
    EntityInstrumentRatesDataGrid,
    EntityInstrumentFeesGrid
} from 'generated/tables'
import { Link } from 'react-router-dom'
import withLSPGridSettings from "utilities/withLSPGridSettings"
import { withRouter } from 'react-router'
import EditEntityInstrumentFeeModal from '../components/Modals/EditEntityInstrumentFeeModal'
import EntityInstrumentDeleteFeeModal from "components/Modals/EntityInstrumentDeleteFeeModal"
import PayScheduledActivityModal from '../components/Modals/PayScheduledActivityModal'
import ScheduledActivityWaiveModal from "components/Modals/ScheduledActivityWaiveModal"
import { noSymbolFormat, shortFormat, thousandsFormat } from '../utilities/Formatters/Number/Formats';
import WrappedEntityInstrumentForm from 'components/Forms/WrappedEntityInstrumentForm';
import getScheduledActivityCSV from '../actions/entityInstrument/getScheduledActivityCSV'
import ScheduledActivityRollbackModal from "components/Modals/ScheduledActivityRollbackModal"
import { pushRoute } from 'cabem-react-next'
import { getRoute } from '../routes';
import portalsUrlBuilder from "utilities/portalsUrlBuilder";
import ViewCashActivityModal from 'components/Modals/ViewCashActivityModal';
import { PermissionedSection } from '../components/PermissionedSection';
import { getCurrentUser, getPortalPermissions, getState, hasPermission } from '../reducers/currentUser';
import { headerFormatter } from 'utilities/Formatters/FormattedColumns';

const PositionsDataGridWithSettings = withLSPGridSettings(EntityInstrumentPositionsDataGrid);
const CashDataGridWithSettings = withLSPGridSettings(EntityInstrumentCashGrid);
const FeesDataGridWithSettings = withLSPGridSettings(EntityInstrumentFeesGrid);


class EntityInstruments extends React.Component {
    constructor(props) {
        super(props);

        this.TabbedNavRef = React.createRef();

        this.state = {
            showEdit: false,
            showPayModal: false,
            searchString: '',
            idPositionScheduledActivity: null,
            searchString: '',
            editEntityInstrumentFeeModalOpen: false,
            deleteEntityInstrumentFeeModalOpen: false,
            idEntityInstrumentFee: null,
            EntityInstrumentFeeTypeName: null
        }
    }

    componentDidMount() {
        document.title = "Entity Instrument | LSP"
    }

    idEntityInstrument = parseInt(this.props.match.params.idEntityInstrument)

    refreshTable = () => {
        if (!this.table) {
            return
        }

        this.table.refresh()
    }

    WrappedScheduledTable = () => {

        const handleExportCsv = (IsTemplate = 0) => {

            const {
                gridRowsPerPage,
                gridPage,
                gridSortColumn,
                gridSortAscending,
                gridSelectedRows,
                idEntityInstrument
            } = this.table.props

            let filters = this.table.getActiveFilters()

            let idPositionScheduledActivities = gridSelectedRows.map(row => (
                row.idPositionScheduledActivity
            ))

            let args = {
                resultsPerPage: gridRowsPerPage,
                currentPage: gridPage,
                sortColumn: gridSortColumn,
                sortAscending: gridSortAscending,
                idPositionScheduledActivities,
                idEntityInstrument,
                IsTemplate,
                ...filters
            }

            this.props.getScheduledActivityCSV(args)
        }

        const handleAdd = () => {
            pushRoute(this.props.history, getRoute('CreateScheduledActivity', {}, { idEntityInstrument: this.idEntityInstrument }))
        }

        const IDColumnAlt = rowData => {
            return <>{rowData.idPositionScheduledActivity}</>
        }

        const IDColumn = ({ rowData }) => {
            return (
                <PermissionedSection userActions={['ViewScheduledActivity']}
                    alt={
                        <IDColumnAlt idPositionScheduledActivity={rowData.idPositionScheduledActivity}/>
                    }
                >
                    <Link to={`/scheduledActivity/${rowData.idPositionScheduledActivity}`}>
                        {rowData.idPositionScheduledActivity}
                    </Link>
                </PermissionedSection>
            )
        }

        const columnDefinitions = [
            {
                id: "idPositionScheduledActivity",
                title: "ID",
                customComponent: IDColumn,
                shrink: 1
            },
            {
                id: "Type",
                title: "Type",
                cssClassName: "align-right-cell",
                grow: .1
            },
            {
                id: "Status",
                title: "Status",
                grow: .1
            },
            {
                id: "EffectiveDate",
                title: "Effective Date",
                customComponent: DateColumn,
                grow: .1
            },
            {
                id: "DueDate",
                title: "Due Date",
                customComponent: DateColumn,
                grow: .1
            },
            {
                id: "Class",
                title: "Class",
                grow: .1
            },
            {
                id: "Amount",
                title: "Amount",
                customComponent: AccountingColumn,
                grow: .1
            },
            {
                id: "DescriptionInternal",
                title: "Internal Description",
                grow: .1
            },
            {
                id: 'DescriptionExternal',
                title: 'External Description',
                grow: .1
            },
            {
                id: "Actions",
                title: "Actions",
                idEntityInstrument: this.idEntityInstrument,
                customComponent: ManageScheduledActivityRowTD,
                refresh: this.refreshTable,
                grow: .15
            },
        ]
        headerFormatter(columnDefinitions)
        const renderActionButtons = () => {
            return (
                <span className="action-buttons-row">
                    {this.props.headerData.entityInstrument?.canManagePositionSheduledServicing && (
                        <PermissionedSection userActions={['ManageScheduledActivity']}>
                            <Button
                                className="btn btn-lsp btn-default btn btn-primary"
                                onClick={handleExportCsv}
                            >
                                Export CSV
                            </Button>
                            <Link to={getRoute("ImportScheduledActivity", { idEntityInstrument: this.idEntityInstrument })}>
                                <Button className="btn btn-lsp">Import CSV</Button>
                            </Link>
                            <Button
                                className="btn btn-lsp btn-default btn btn-primary mr-2"
                                onClick={() => handleExportCsv(1)}
                            >
                                Export CSV Template
                            </Button>
                            <Button
                                onClick={handleAdd}
                                className='btn btn-lsp btn btn-primary table-btn'
                            >
                                Add
                            </Button>
                        </PermissionedSection>
                    )}
                </span>
            );
        }

        return (
            <>
                {this.state.showPayModal &&
                    <PayScheduledActivityModal
                        header="Pay Schedule Activity"
                        size={"xl"}
                        className="link-cash-modal"
                        idPositionScheduledActivity={this.state.currentIdScheduledActivity}
                        onSuccess={() => {
                            this.setState({ showPayModal: false, currentIdScheduledActivity: null })
                            this.table.refresh()
                        }}
                        onRequestHide={() => this.setState({ showPayModal: false, currentIdScheduledActivity: null })} />
                }
                <div className='lsp-data-grid'>
                    <PositionScheduledActivitiesDataGrid
                        ref={(el) => (this.table = el)}
                        fetchOnReady
                        paginationRowsPerPage={25}
                        columnDefs={columnDefinitions}
                        selectableRows={true}
                        refreshOnColumnChange
                        actionButtons={renderActionButtons()}
                        idEntityInstrument={this.idEntityInstrument}
                        fetchParams={{ idEntityInstrument: this.idEntityInstrument }}
                    />
                </div>
            </>
        )
    }

    WrappedPositionsTable = () => {

        const EditColumn = ({ rowData }) => {
            return (
                <PermissionedSection userActions={['ManageServicingSettings']}>
                    <Link to={`/entityinstrument/${this.idEntityInstrument}/position/edit/${rowData.idPosition}`} headerData={this.props.headerData}>
                        <Button className="action-btn">Edit</Button>
                    </Link>
                </PermissionedSection>
            )
        }

        const columnDefinitions = [
            {
                id: "idPosition",
                title: "ID",
                cssClassName: "align-right-cell",
                shrink: 1
            },
            {
                id: "PositionKey",
                title: "Key",
            },
            {
                id: "StartDate",
                title: "Start Date",
                customComponent: DateColumn,
            },
            {
                id: "EndDate",
                title: "End Date",
                customComponent: DateColumn,
            },
            {
                id: "Date",
                title: "Balance Date",
                customComponent: DateColumn,
            },
            {
                id: "CommitmentEnd",
                title: "Commitment",
                customComponent: NoSymbolMoneyColumn,
                cssClassName: "align-right-cell",
            },
            {
                id: "BalanceEnd",
                title: "Outstanding",
                customComponent: NoSymbolMoneyColumn,
                cssClassName: "align-right-cell",
            },
            {
                id: "WieghtedFundedRate",
                title: "WF Rate",
                customComponent: NoSymbolMoneyColumn,
                cssClassName: "align-right-cell",
            },
            {
                id: "WieghtedFundedSpread",
                title: "WF Spread",
                customComponent: NoSymbolMoneyColumn,
                cssClassName: "align-right-cell",
            },
            {
                id: "WieghtedFundedBase",
                title: "WF Base",
                customComponent: NoSymbolMoneyColumn,
                cssClassName: "align-right-cell",
            },
            {
                id: "InterestAccrued",
                title: "Accrued Int",
            },
            {
                id: "FeesAccrued",
                title: "Accrued Fees",
            },
            {
                id: "PikAccrued",
                title: "Accrued PIK",
            },
            {
                id: "LCBalanceEnd",
                title: "LC",
            },
            {
                id: "PikBalanceEnd",
                title: "PIK",
            },
            {
                id: 'ApplyPrin',
                title: 'Apply Prin'
            },
            {
                id: "Active",
                title: "Active",
            },
            //desired functionality unclear, but this relates directly to griddle
            //will need to be rewritten
            {
                id: "Action",
                title: "Action",
                customComponent: EditColumn,
            },

        ]
        headerFormatter(columnDefinitions)

        return (
            <div className='lsp-data-grid'>
                <PositionsDataGridWithSettings
                    ref={(el) => (this.table = el)}
                    columnDefs={columnDefinitions}
                    searchString={this.state.searchString}
                    fetchOnReady
                    renderCsvButton
                    paginationRowsPerPage={25}
                    refreshOnColumnChange
                    idEntityInstrument={this.idEntityInstrument}
                    fetchParams={{ idEntityInstrument: this.idEntityInstrument }}
                />
            </div>
        )
    }

    WrappedPrincipalTable = () => {

        const [show, setShow] = useState(null)

        const TransactionRefLinkColumn = ({ rowData }) => {

            //ensure that only one modal opens rather than all of them.
            const idCashTransaction = rowData.idCashTransaction
            const idWireToBankTransaction = rowData.idWireToBankTransaction

            if (!idCashTransaction) return null //(empty cell with no contents)
            if (idCashTransaction && !idWireToBankTransaction) return idCashTransaction //(no link, just the number)

            return (
                <>
                    {/* HALP! Max depth exceeded */}
                    <Button className="action-btn" onClick={() => setShow(idCashTransaction)}>
                        {idCashTransaction}
                    </Button>
                    {show === idCashTransaction && (
                        <ViewCashActivityModal
                            onRequestHide={() => setShow(null)}
                            header={"Cash Transaction Activity"}
                            idWireToBankTransaction={idWireToBankTransaction}
                            idCashTransaction={idCashTransaction}
                            size={'xl'}
                        />
                    )}
                </>
            )
        }

        const columnDefinitions = [
            {
                id: "BalanceDate",
                title: "Balance Date",
                customComponent: DateColumn
            },
            {
                id: "TransactionLabel",
                title: "Transaction Label",
            },
            {
                id: "CommitmentChange",
                title: "Commitment Change",
                customComponent: AccountingColumn
            },
            {
                id: "PrincipalChange",
                title: "Principal Change",
                customComponent: AccountingColumn
            },
            {
                id: "SourceId",
                title: "WSO Ref # ",
            },
            {
                id: "idCashTransaction",
                title: "Cash Transaction Ref #",
                customComponent: TransactionRefLinkColumn
            },

        ]

        headerFormatter(columnDefinitions)

        return (
            <div className='lsp-data-grid'>
                <EntityInstrumentPrincipalActivitiesDataGrid
                    fetchOnReady
                    renderCsvButton
                    paginationRowsPerPage={25}
                    columnDefs={columnDefinitions}
                    refreshOnColumnChange
                    idEntityInstrument={this.idEntityInstrument}
                    columns={[]}
                    fetchParams={{ idEntityInstrument: this.idEntityInstrument }}
                />
            </div>
        )
    }

    WrappedCashTable = () => {
        const [show, setShow] = useState(false)

        const ViewColumn = ({ rowData }) => {

            //ensure that only one modal opens rather than all of them.
            const id = rowData.idWireToBankTransaction

            return (
                <>
                    {/* HALP! Max depth exceeded */}
                    <Button className="action-btn" onClick={() => setShow(id)}>
                        View
                    </Button>
                    {show == rowData.idWireToBankTransaction &&
                        <ViewCashActivityModal
                            onRequestHide={() => setShow(false)}
                            header={"Cash Transaction Activity"}
                            idWireToBankTransaction={id}
                            size={'xl'}
                        />
                    }
                </>
            )
        }

        const columnDefinitions = [
            {
                id: "BankTransactionCashDate",
                title: "Cash Date",
                customComponent: DateColumn
            },
            {
                id: "Principal",
                title: "Principal",
                customComponent: AccountingColumn
            },
            {
                id: "Interest",
                title: "Interest",
                customComponent: AccountingColumn
            },
            {
                id: "Fee",
                title: "Fee",
                customComponent: AccountingColumn
            },
            {
                id: "Escrow",
                title: "Escrow",
                customComponent: AccountingColumn
            },
            {
                id: "View",
                title: "View",
                customComponent: ViewColumn
            },

        ]
        headerFormatter(columnDefinitions)
        return (
            <div className='lsp-data-grid'>
                <CashDataGridWithSettings
                    fetchOnReady
                    renderCsvButton
                    paginationRowsPerPage={25}
                    columnDefs={columnDefinitions}
                    refreshOnColumnChange
                    idEntityInstrument={this.idEntityInstrument}
                    columns={[]}
                    fetchParams={{ idEntityInstrument: this.idEntityInstrument }}
                />
            </div>
        )
    }

    WrappedHistoryTable = () => {

        const columnDefinitions = [
            {
                id: "Date",
                title: "Date",
                customComponent: DateColumn
            },
            {
                id: "CommitmentBegin",
                title: "Commitment Begin",
                customComponent: DateColumn
            },
            {
                id: "CommitmentEffectiveDateActivity",
                title: "Commitment Activity",
                customComponent: AccountingColumn
            },
            {
                id: "CommitmentEnd",
                title: "Commitment End",
                customComponent: DateColumn
            },
            {
                id: "BalanceBegin",
                title: "Outstanding Begin",
                customComponent: DateColumn
            },
            {
                id: "Advances",
                title: "Advances",
                customComponent: AccountingColumn
            },
            {
                id: "Paydowns",
                title: "Paydowns",
                customComponent: AccountingColumn
            },
            {
                id: "BalanceEnd",
                title: "Balance End",
                customComponent: DateColumn
            },
            {
                id: "InterestEarned",
                title: "Interest",
                customComponent: AccountingColumn
            },
            {
                id: "InterestAccrued",
                title: "Accrued Interest",
                customComponent: AccountingColumn
            },
            {
                id: "WieghtedFundedRate",
                title: "WT Funded Rate"
            },
            {
                id: "WieghtedFundedSpread",
                title: "WT Funded Spread"
            },
            {
                id: "WieghtedFundedBase",
                title: "WT Funded Base Rate"
            },
            {
                id: "FeesEarned",
                title: "Fee Earned",
                customComponent: AccountingColumn
            },
            {
                id: "FeesAccrued",
                title: "Accrued Fees",
                customComponent: AccountingColumn
            },
            {
                id: "LCBalanceBegin",
                title: "LC Begin",
                customComponent: DateColumn
            },
            {
                id: "LCBalanceActivity",
                title: "LC Activity"
            },
            {
                id: "LCBalanceEnd",
                title: "LC End",
                customComponent: DateColumn
            },
            {
                id: "PikBalanceBegin",
                title: "PIK Begin",
                customComponent: DateColumn
            },
            {
                id: "PikActivity",
                title: "PIK Activity"
            },
            {
                id: "PikBalanceEnd",
                title: "PIK End",
                customComponent: DateColumn
            },
            {
                id: "PikEarned",
                title: "PIK Earned",
                customComponent: AccountingColumn
            },
            {
                id: "PikAccrued",
                title: "PIK Accrued",
                customComponent: AccountingColumn
            }

        ]
        headerFormatter(columnDefinitions)
        return (
            <div className='lsp-data-grid'>
                <HistoryDataGrid
                    fetchOnReady
                    renderCsvButton
                    paginationRowsPerPage={25}
                    columnDefs={columnDefinitions}
                    refreshOnColumnChange
                    idEntityInstrument={this.idEntityInstrument}
                    fetchParams={{ idEntityInstrument: this.idEntityInstrument }}
                />
            </div>
        )
    }

    WrappedRatesTable = () => {

        const EditColumn = ({ rowData }) => {
            return (
                <PermissionedSection userActions={['ManageInstrumentRates']}>
                    <Link to={`/entityinstrument/${this.idEntityInstrument}/rate/${rowData.idInstrumentRate}`}>
                        Edit
                    </Link>
                </PermissionedSection>
            )
        }

        const renderActionButtons = (idEntityInstrument) => {
            return (
                <PermissionedSection userActions={['ManageInstrumentRates']}>
                    <span className="action-buttons-row">
                        <Link
                            to={`/entityinstrument/${idEntityInstrument}/rate/0`}
                            className='btn btn-lsp btn-default'
                        >
                            Add
                        </Link>
                    </span>
                </PermissionedSection>
            );
        }

        const SpreadColumn = (props) => (
            <div className="fixed-width-cell">
                <span className={props.value < 0 ? "negative" : ""}>
                    {NumberFormatter.noSymbolFormat(props.value, MONEY, { precision: 6 })}
                </span>
            </div>
        );

        const columnDefinitions = [
            {
                id: "idInstrumentRate",
                title: "ID",
                cssClassName: "align-right-cell",
                shrink: 1
            },
            {
                id: "IsActive",
                title: "Active",
                customComponent: BooleanColumn
            },
            {
                id: "EffectiveDate",
                title: "Effective Date",
                customComponent: DateColumn,
            },
            {
                id: "ExpirationDate",
                title: "Expiration Date",
                customComponent: DateColumn,
            },
            {
                id: "BaseRate",
                title: "Base Rate",
                cssClassName: "align-right-cell",
            },
            {
                id: "Spread",
                title: "Spread",
                customComponent: SpreadColumn,
            },
            {
                id: "BaseRateResetType",
                title: "Reset Type",
            },
            {
                id: "BaseRateResetIntervalValue",
                title: "Reset Days",
            },
            {
                id: "BaseRateResetInterval",
                title: "Reset Interval",
            },
            {
                id: "Floor",
                title: "Floor",
            },
            {
                id: "Ceiling",
                title: "Ceiling",
            },
            {
                id: "ClearanceDaysType",
                title: "Clearance Type",
            },
            {
                id: "ClearanceDays",
                title: "Clearance Days",
            },
            {
                id: "PaymentGraceDays",
                title: "Payment Grace Days",
            },
            {
                id: "GraceDaysType",
                title: "Grace Days Type",
            },
            {
                id: "RateSetLookbackDaysType",
                title: "Rate Set Lookback Days Type",
            },
            {
                id: "RateSetLookbackBusinessDays",
                title: "Rate Set Lookback Days",
            },
            {
                id: "RateOptions",
                title: "Rate Options",
            },
            {
                id: "RoundingDisplayValue",
                title: "Interest Rate Rounding",
            },
            {
                id: "RoundUpOrDown",
                title: "Round Up/Down Methodology",
            },
            {
                id: "Actions",
                title: "Actions",
                customComponent: EditColumn,
            },

        ]
        headerFormatter(columnDefinitions)

        return (
            <div className='lsp-data-grid'>
                <EntityInstrumentRatesDataGrid
                    ref={(el) => (this.table = el)}
                    columnDefs={columnDefinitions}
                    searchString={this.state.searchString}
                    fetchOnReady
                    paginationRowsPerPage={25}
                    refreshOnColumnChange
                    idEntityInstrument={this.idEntityInstrument}
                    fetchParams={{ idEntityInstrument: this.idEntityInstrument }}
                    actionButtons={renderActionButtons(this.idEntityInstrument)}
                />
            </div>
        )
    }

    WrappedFeesTable = () => {

        const handleEditFee = idEntityInstrumentFee => {
            this.setState({ idEntityInstrumentFee }, handleToggleEditModal())
        }

        const handleDeleteFee = (idEntityInstrumentFee, EntityInstrumentFeeTypeName) => {
            this.setState({ idEntityInstrumentFee, EntityInstrumentFeeTypeName }, handleToggleDeleteModal())
        }

        const handleToggleEditModal = () => {
            this.setState({
                editEntityInstrumentFeeModalOpen: !this.state.editEntityInstrumentFeeModalOpen
            })
        }

        const handleToggleDeleteModal = () => {
            this.setState({
                deleteEntityInstrumentFeeModalOpen: !this.state.deleteEntityInstrumentFeeModalOpen
            })
        }

        const ActionColumn = ({ rowData }) => {
            return (
                <PermissionedSection userActions={['ManageEntityInstrumentFee']}>
                    <div className="d-inline-flex">
                        <Button className="action-btn" onClick={() => handleEditFee(rowData.idEntityInstrumentFee)}>
                            Edit
                        </Button><div className="dot"><div>.</div></div>
                        <Button className="action-btn" onClick={() => handleDeleteFee(rowData.idEntityInstrumentFee, rowData.EntityInstrumentFeeTypeName)}>
                            Delete
                        </Button>
                    </div>
                </PermissionedSection>
            )
        }

        const DealColumnTD = ({ rowData }) => {
            // This takes the current base url and removes '-als'
            // This assumes that this is how the portals base url will be structured
            const portalBaseUrl = portalsUrlBuilder(window.__AP_PORTAL_URL__)
            let link
            // if check for a deal id
            if (rowData.idDeal) link = `${portalBaseUrl}/dashboard/opportunities#/opportunity/${rowData.idDeal}`
            //check for a marketdeal id
            //this should be second, as it is more specific, there should not be both, but if there is, we should present the marketdeal
            if (rowData.idMarketDeal) link = `${portalBaseUrl}/dashboard/opportunities#/marketdeal/${rowData.idMarketDeal}`
            return (
                <a href={link}>
                    {rowData.MarketDealName}
                </a>
            )
        }

        const handleEditOnSuccess = () => {
            this.setState({ idEntityInstrumentFee: '' }, handleToggleEditModal())
            this.table.refresh()
        }

        const handleDeleteOnSuccess = () => {
            this.setState({ idEntityInstrumentFee: '', EntityInstrumentFeeTypeName: '' }, handleToggleDeleteModal())
            this.table.refresh()
        }

        function renderActionButtons() {
            return (
                <PermissionedSection userActions={['CreateEntityInstrumentFee']}>
                    <span className="action-buttons-row">
                        <Button
                            onClick={handleToggleEditModal}
                            className='btn btn-ap btn btn-primary table-btn'
                        >
                            New Fee
                        </Button>
                    </span>
                </PermissionedSection>
            );
        }

        const columnDefinitions = [
            {
                id: "idEntityInstrumentFee",
                title: "ID",
                cssClassName: "align-right-cell",
                shrink: 1
            },
            {
                id: "EntityInstrumentFeeTypeName",
                title: "Type",
            },
            {
                id: "Value",
                title: "Value",
                customComponent: PercentColumn
            },
            {
                id: "StartDate",
                title: "Start Date",
                customComponent: DateColumn,
            },
            {
                id: "EndDate",
                title: "End Date",
                customComponent: DateColumn,
            },
            {
                id: "MarketDealName",
                title: "Deal",
                customComponent: DealColumnTD
            },
            {
                id: "Action",
                title: "Action",
                idEntityInstrument: this.idEntityInstrument,
                refresh: this.refreshTable,
                customComponent: ActionColumn,
            },
        ]
        headerFormatter(columnDefinitions)

        const feeModalHeader = () => {
            if (this.state.idEntityInstrumentFee) {
                return "Edit Fee"
            }

            return "Create New Fee"
        }

        return (
            <>
                {this.state.editEntityInstrumentFeeModalOpen &&
                    <EditEntityInstrumentFeeModal
                        className="instrument-fee-modal"
                        idEntityInstrument={this.idEntityInstrument}
                        idEntityInstrumentFee={this.state.idEntityInstrumentFee}
                        onRequestHide={handleToggleEditModal}
                        onSuccess={handleEditOnSuccess}
                        header={feeModalHeader()}
                    />
                }
                {this.state.deleteEntityInstrumentFeeModalOpen &&
                    <EntityInstrumentDeleteFeeModal
                        idEntityInstrument={this.idEntityInstrument}
                        idEntityInstrumentFee={this.state.idEntityInstrumentFee}
                        EntityInstrumentFeeTypeName={this.state.EntityInstrumentFeeTypeName}
                        onRequestHide={handleToggleDeleteModal}
                        onSuccess={handleDeleteOnSuccess}
                        header={"Confirm Delete"}
                    />
                }
                <div className='lsp-data-grid'>
                    <FeesDataGridWithSettings
                        ref={(el) => (this.table = el)}
                        columnDefs={columnDefinitions}
                        searchString={this.state.searchString}
                        fetchOnReady
                        renderCsvButton
                        paginationRowsPerPage={25}
                        refreshOnColumnChange
                        actionButtons={renderActionButtons()}
                        idEntityInstrument={this.idEntityInstrument}
                        fetchParams={{ idEntityInstrument: this.idEntityInstrument }}
                    />
                </div>
            </>
        )
    }

    //The contents for each tab should be added here as a component
    tabs = [];
    loadTabs = (hasPermission) => {
        this.tabs.push({
            key: "Positions",
            label: "Positions",
            component: this.WrappedPositionsTable,
        });

        if (hasPermission("ViewScheduledActivity")) {
            this.tabs.push({
                key: "Activity",
                label: "Scheduled", //Formerly known as "Activity"
                component: this.WrappedScheduledTable,
            });
        }

        this.tabs.push({
            key: "Principal",
            label: "Principal",
            component: this.WrappedPrincipalTable,
        });

        this.tabs.push({
            key: "Cash",
            label: "Cash",
            component: this.WrappedCashTable,
        });

        this.tabs.push({
            key: "History",
            label: "History",
            component: this.WrappedHistoryTable,
        });

        if(hasPermission("ViewBorrowerInstruments")) {
            this.tabs.push({
                key: "Rates",
                label: "Rates",
                component: this.WrappedRatesTable,
            });
        }

        this.tabs.push({
            key: "Fees",
            label: "Fees",
            component: this.WrappedFeesTable,
        });
    }

    //handle toggling to view or hide the edit form
    toggleEdit = () => {
        this.setState({ showEdit: !this.state.showEdit })
    }

    render() {
        const { hasPermission } = this.props;
        if(hasPermission && this.tabs.length == 0) this.loadTabs(hasPermission);

        return (
            <>
                <div className='entity-instrument'>
                    <EntityInstrumentGlobalHeader
                        headerData={this.props.headerData}
                        idEntityInstrument={this.idEntityInstrument}
                        edit={this.toggleEdit}
                        isEditOpen={this.state.showEdit}
                    />
                    <Row>
                        <Col>
                            {/* Edit Form  */}
                            {
                                this.state.showEdit &&
                            <div className='EntityInstrumentForm'>
                                <WrappedEntityInstrumentForm toggleVisible={this.toggleEdit} idEntityInstrument={this.idEntityInstrument} />
                            </div>
                            }
                            <Card className="panel panel-tabbed mt-2" header=" ">
                                <Card.Header />
                                <Card.Body>
                                    <TabbedNav
                                        // ref={this.TabbedNavRef}
                                        tabs={this.tabs}
                                        defaultActive={"Positions"}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </>
        )
    }
}

const ManageScheduledActivityRowTD = (props) => {

    const [isWaiveModalOpen, setIsWaiveModalOpen] = useState(false)
    const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false)
    const { rowData } = props;
    const refresh = props.cellProperties?.refresh

    const handleEditScheduledActivity = (rowData) => {
        console.log('pay', rowData)
    }

    //these 3 buttons should render conditionally based on showPay, showWaive, and showRollback flags that come from the backend, respectively.
    return (
        <div className="scheduled-activities-actions" key={rowData.idPositionScheduledActivity}>
           <PermissionedSection userActions={["ManageScheduledActivity"]}>
                <span className="d-inline-flex">
                    <Button className="action-btn top-row-padding" onClick={() => handleEditScheduledActivity(rowData)}>
                        Pay
                    </Button><div className="dot"><div>.</div></div>
                    <Button className="action-btn top-row-padding" onClick={() => setIsWaiveModalOpen(true)}>
                        Waive
                    </Button><div className="dot"><div>.</div></div>
                </span>
                <Button className="action-btn bottom-row-padding" onClick={() => setIsRollbackModalOpen(true)}>
                    Rollback
                </Button>
           </PermissionedSection>
            {isWaiveModalOpen && (
                <ScheduledActivityWaiveModal
                    onRequestHide={() => setIsWaiveModalOpen(false)}
                    onSuccess={refresh}
                    header={"Confirm Waive"}
                    idPositionScheduledActivity={rowData.idPositionScheduledActivity}
                />
            )}
            {isRollbackModalOpen && (
                <ScheduledActivityRollbackModal
                    onRequestHide={() => setIsRollbackModalOpen(false)}
                    onSuccess={refresh}
                    header={"Rollback Scheduled Activity"}
                    idPositionScheduledActivity={rowData.idPositionScheduledActivity}
                    size='lg'
                />
            )}
        </div>
    )
}


export default withRouter(connect(
    (state) => ({
        headerDataPending: selectHeaderDataPending(state),
        headerData: selectHeaderData(state),
        hasPermission: hasPermission(state),
    }),
    (dispatch) => bindActionCreators({
        getScheduledActivityCSV
    }, dispatch)
)(EntityInstruments))

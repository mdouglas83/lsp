import React from "react";

import { Modal } from 'cabem-react-next'
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { EntityInstrumentCashActivityDataGrid, EntityInstrumentLoanActivityDataGrid } from "generated/tables"; {/* HALP! see tables.js */}
import { DateColumn, AccountingColumn, TextColumn, IDColumn } from 'utilities/Formatters/FormattedColumns'


class ViewCashActivityModal extends Modal {
    constructor() {
        super()
    }

    renderFooter = () => {
        return null
    }

    renderBody = () => {

        const { idWireToBankTransaction } = this.props

        const cashActivityColumnDefs = [
            {
                title: "Tran #",
                id: "idBankTransaction",
                customComponent: IDColumn,
                shrink: 1,
                grow: 0
            },
            {
                title: "Date",
                id: "Date",
                customComponent: DateColumn,
                shrink: 1,
                grow: 0
            },
            {
                title: "Amount",
                id: "Amount",
                customComponent: AccountingColumn,
                shrink: 1,
                grow: 0
            },
            {
                title: "Text",
                id: "Text",
                customComponent: TextColumn,
                grow: 1
            }
        ]

        const loanActivityColumnDefs = [
            {
                title: "Cash Transaction Ref #",
                id: "idCashTransaction",
                customComponent: IDColumn,
                shrink: 1,
                grow: 0
            },
            {
                title: "Amount",
                id: "Amount",
                customComponent: AccountingColumn,
                shrink: 1,
                grow: 0
            },
            {
                title: "Description",
                id: "Description",
                customComponent: TextColumn,
                grow: 1
            }
        ]

        return (
            <div className="pb-2">
                {/* Cash Activity DataGrid  */}
                Cash Activity
                <div className="ap-data-grid">
                    {/* HALP! */}
                    <EntityInstrumentCashActivityDataGrid
                        fetchOnReady
                        paginationRowsPerPage={25}
                        columnDefs={cashActivityColumnDefs}
                        refreshOnColumnChange
                        columns={[]}
                        fetchParams={{ idWireToBankTransaction: idWireToBankTransaction }}
                    />
                </div>
                {/* Loan Activity DataGrid  */}
                Loan Activity
                <div className="ap-data-grid">
                    {/* this grid is stuck on loading and never makes the network call.  No error message */}
                    {/* HALP! */}
                    <EntityInstrumentLoanActivityDataGrid
                        fetchOnReady
                        paginationRowsPerPage={25}
                        columnDefs={loanActivityColumnDefs}
                        refreshOnColumnChange
                        columns={[]}
                        fetchParams={{ idWireToBankTransaction: idWireToBankTransaction }}
                    />
                </div>
            </div>
        )
    }
}

export default connect(
    (state) => ({
    }),
    (dispatch) => bindActionCreators({
    }, dispatch)

)(ViewCashActivityModal)
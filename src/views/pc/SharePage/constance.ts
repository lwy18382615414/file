import type { TableColumn } from "@/types/type";

export const TABLE_COLUMNS: TableColumn[] = [
  {
    type: "selection",
    width: 30,
    selectable: (row: any) => {
      return !row.isDelete;
    },
  },
  {
    label: "columnOpt.docName",
    prop: "name",
    slots: "name",
    showOverflowTooltip: true,
    headerSlot: "headerText",
  },
  {
    label: "columnOpt.size",
    prop: "size",
    width: 100,
    slots: "size",
    headerSlot: "headerText",
  },
  {
    label: "columnOpt.modifiedTime",
    prop: "updateAt",
    width: 180,
    slots: "updateAt",
    headerSlot: "headerText",
  },
];

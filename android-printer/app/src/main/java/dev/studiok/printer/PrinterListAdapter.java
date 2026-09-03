package dev.studiok.printer;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.dothantech.printer.IDzPrinter.PrinterAddress;

import java.util.ArrayList;
import java.util.List;

final class PrinterListAdapter extends BaseAdapter {
    private final LayoutInflater inflater;
    private final List<PrinterAddress> printers = new ArrayList<>();

    PrinterListAdapter(Context context) {
        this.inflater = LayoutInflater.from(context);
    }

    void setPrinters(List<PrinterAddress> next) {
        printers.clear();
        if (next != null) {
            printers.addAll(next);
        }
        notifyDataSetChanged();
    }

    PrinterAddress getPrinter(int position) {
        return printers.get(position);
    }

    @Override
    public int getCount() {
        return printers.size();
    }

    @Override
    public Object getItem(int position) {
        return printers.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View view = convertView;
        if (view == null) {
            view = inflater.inflate(R.layout.printer_item, parent, false);
        }

        PrinterAddress printer = printers.get(position);
        ((TextView) view.findViewById(R.id.tv_device_name)).setText(printer.shownName);
        ((TextView) view.findViewById(R.id.tv_macaddress)).setText(printer.macAddress);
        return view;
    }
}

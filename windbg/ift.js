'use strict';
/*
 * Usage: .scriptload ift.js
 *        dx -g @$ift()
 *        or
 *        dx -g @$ift("Ps")
 *
 * Getting the same result with manual input:
 * dx @$table = *(nt!_INVERTED_FUNCTION_TABLE **)&nt!KeUserInvertedFunctionTable
 * dx -g @$table->TableEntry->Take(@$table->CurrentSize)
 * ; PsInvertedFunctionTable
 * dx -g ((nt!_INVERTED_FUNCTION_TABLE *)&nt!PsInvertedFunctionTable)->TableEntry->Take(0xBE)
 */
function *GetInvertedFunctionTable(prefix = 'KeUser') {
  if (!host.currentSession.Attributes.Target.IsKernelTarget) {
    host.diagnostics.debugLog('Error: requires kernel mode debugger environment.\n');
    return;
  }

  let table = host.createPointerObject(
    host.getModuleSymbolAddress('nt', `${prefix}InvertedFunctionTable`),
    'nt', `_INVERTED_FUNCTION_TABLE ${'Ps' === prefix ? '*' : '**'}`
  );

  if ('KeUser' === prefix) table = table.dereference();
  for (let entry of table.TableEntry.Take(
    'KeUser' === prefix ? table.CurrentSize : 0xBE
  )) yield entry;
}

function initializeScript() {
  return [new host.functionAlias(GetInvertedFunctionTable, 'ift')];
}

-- Test file for DECLARE statement grouping

DECLARE @fromdate CHAR(12) = '2018-01-01'
DECLARE @todate CHAR(12) = '2020-01-01'
DECLARE @department VARCHAR(50) = 'IT'

SELECT emp.EmployeeID,emp.FirstName,emp.LastName
FROM Employees AS emp
WHERE emp.HireDate >= @fromdate 
AND emp.HireDate < @todate 
AND emp.DepartmentName = @department